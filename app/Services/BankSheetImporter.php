<?php

namespace App\Services;

use App\Models\BankMovement as Mov;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Lee la planilla "bancos online" exportada a CSV y la trae al sistema.
 *
 * La hoja tiene dos zonas pegadas: a la izquierda unos bloques de resumen de
 * saldos y a la derecha el libro de movimientos. Aca solo importa la derecha:
 * los saldos se recalculan a partir de los movimientos, que es justamente lo
 * que evita que una celda quede desfasada.
 *
 * Cada fila puede tocar mas de una cuenta a la vez (un traspaso), asi que una
 * fila del CSV puede generar mas de un movimiento.
 */
class BankSheetImporter
{
    /** Encabezado de la planilla -> slug de la cuenta en el sistema. */
    private const COLUMNAS_CUENTA = [
        'friendly' => 'friendly',
        'estado friendly' => 'friendly',
        'bci' => 'bci',
        'bci 888' => 'bci',
        'falabella' => 'falabella',
        'rentamania' => 'rentamania',
        'cuenta rut' => 'cuenta_rut',
        'ahorro' => 'ahorro',
        'chile' => 'chile',
        'menta limon' => 'chile',
        'efectivo' => 'efectivo',
    ];

    public function __construct(private BankStore $store)
    {
    }

    /**
     * Lee el archivo y devuelve lo que se importaria, sin escribir nada.
     */
    public function preview(string $path): array
    {
        $datos = $this->parse($path);
        $filas = $datos['filas'];

        $cuentas = collect($this->store->all(BankStore::ACCOUNTS))->pluck('name', 'slug');
        $porCuenta = [];

        foreach ($filas as $f) {
            foreach ($f['movimientos'] as $m) {
                $slug = $m['slug'];
                $porCuenta[$slug] ??= [
                    'cuenta' => $cuentas[$slug] ?? $slug,
                    'movs' => 0,
                    'cargas' => 0.0,
                    'retiros' => 0.0,
                ];
                $porCuenta[$slug]['movs']++;
                $porCuenta[$slug][$m['amount'] >= 0 ? 'cargas' : 'retiros'] += $m['amount'];
            }
        }

        $fechas = array_filter(array_column($filas, 'date'));
        $montos = array_merge(...array_map(fn ($f) => array_column($f['movimientos'], 'amount'), $filas)) ?: [];

        return [
            'columnas_detectadas' => $datos['columnas'],
            'cuentas_desconocidas' => $datos['cuentas_desconocidas'],
            'filas_leidas' => count($filas),
            'movimientos' => count($montos),
            'cargas' => array_sum(array_filter($montos, fn ($v) => $v > 0)),
            'retiros' => array_sum(array_filter($montos, fn ($v) => $v < 0)),
            'periodo' => $fechas ? [min($fechas), max($fechas)] : null,
            'por_cuenta' => array_values($porCuenta),
            'problemas' => $this->problemas($filas),
            'clientes_nuevos' => array_slice($nuevos = $this->clientesNuevos($filas), 0, 100),
            'clientes_nuevos_total' => count($nuevos),
        ];
    }

    /**
     * Importa de verdad. Si algo falla a mitad de camino, BankStore deja los
     * archivos como estaban: o entra la planilla entera o no entra nada.
     */
    public function import(string $path, string $filename, ?User $user = null): array
    {
        $filas = $this->parse($path)['filas'];

        return $this->store->transaction(function () use ($filas, $filename, $user) {
            $fechas = array_filter(array_column($filas, 'date'));

            $import = $this->store->insert(BankStore::IMPORTS, [
                'filename' => $filename,
                'rows_total' => count($filas),
                'rows_imported' => 0,
                'rows_skipped' => 0,
                'period_start' => $fechas ? min($fechas) : null,
                'period_end' => $fechas ? max($fechas) : null,
                'user_id' => $user?->id,
                'notes' => null,
            ]);

            // La planilla importada tambien es un turno: asi el historial queda
            // completo y ningun movimiento vive fuera de un turno.
            $turno = $this->store->insert(BankStore::SHIFTS, [
                'opened_by' => $user?->id,
                'opened_at' => ($fechas ? min($fechas) : now()->toDateString()) . 'T00:00:00-03:00',
                'closed_by' => $user?->id,
                'closed_at' => now()->toIso8601String(),
                'is_active' => false,
                'source' => 'import',
                'opening_note' => 'Importación de ' . $filename,
                'closing_note' => null,
            ]);

            $cuentas = collect($this->store->all(BankStore::ACCOUNTS))->pluck('id', 'slug');
            $cajeros = $this->mapaCajeros();
            $hoy = now()->toDateString();

            $aInsertar = [];
            $omitidos = 0;

            foreach ($filas as $fila) {
                if (!$fila['movimientos']) {
                    $omitidos++;
                    continue;
                }

                $clientId = $this->resolverCliente($fila['external_id'], $fila['nombre']);
                $otroNombre = $this->nombreDistinto($clientId, $fila['nombre']);

                // Sin fecha no se puede ubicar el movimiento en el tiempo: se le
                // pone la de hoy para no perder la plata, y queda anotado.
                $sinFecha = $fila['date'] === null;
                $fecha = $fila['date'] ?? $hoy;

                // Una fila que toca dos cuentas y cuadra en cero es un traspaso
                $neto = array_sum(array_column($fila['movimientos'], 'amount'));
                $esTraspaso = count($fila['movimientos']) > 1 && abs($neto) < 0.01;
                $grupo = $esTraspaso ? (string) Str::uuid() : null;

                $cajeroId = $cajeros[Str::lower((string) $fila['cajero'])] ?? null;

                $notas = array_filter([
                    $fila['asunto'] ?: null,
                    // El ID mandó, pero la planilla traía otro nombre. Puede ser
                    // un tipeo, o dos personas compartiendo el mismo ID: queda
                    // anotado para poder revisarlo despues.
                    $otroNombre ? 'Planilla decía: ' . $otroNombre : null,
                    $sinFecha ? 'Sin fecha en la planilla (fila ' . $fila['linea'] . ')' : null,
                    $fila['cajero'] && !$cajeroId ? 'Cajero: ' . $fila['cajero'] : null,
                ]);

                foreach ($fila['movimientos'] as $m) {
                    if (!isset($cuentas[$m['slug']])) {
                        $omitidos++;
                        continue;
                    }

                    $aInsertar[] = [
                        'date' => $fecha,
                        'bank_shift_id' => (int) $turno['id'],
                        'bank_account_id' => (int) $cuentas[$m['slug']],
                        'bank_client_id' => $clientId,
                        'user_id' => $cajeroId,
                        'amount' => $m['amount'],
                        'kind' => $esTraspaso
                            ? Mov::KIND_TRASPASO
                            : ($m['amount'] >= 0 ? Mov::KIND_CARGA : Mov::KIND_RETIRO),
                        'description' => $notas ? implode(' · ', $notas) : null,
                        'transfer_group_id' => $grupo,
                        'bank_import_id' => (int) $import['id'],
                        'edit_history' => null,
                    ];
                }
            }

            // Una sola escritura para los 1.100 movimientos en vez de una por fila
            $this->store->insertMany(BankStore::MOVEMENTS, $aInsertar);

            return $this->store->update(BankStore::IMPORTS, $import['id'], [
                'rows_imported' => count($aInsertar),
                'rows_skipped' => $omitidos,
            ]);
        }, [BankStore::CLIENTS, BankStore::MOVEMENTS, BankStore::IMPORTS, BankStore::SHIFTS]);
    }

    /**
     * Convierte el CSV en filas normalizadas. No escribe nada.
     */
    private function parse(string $path): array
    {
        $fh = fopen($path, 'r');

        if (!$fh) {
            throw new \RuntimeException('No se pudo abrir el archivo');
        }

        $encabezado = fgetcsv($fh);

        if (!$encabezado) {
            fclose($fh);
            throw new \RuntimeException('El archivo está vacío');
        }

        $mapa = $this->mapearColumnas($encabezado);

        if ($mapa['fecha'] === null) {
            fclose($fh);
            throw new \RuntimeException('No se encontró la columna FECHA en el encabezado');
        }

        $filas = [];
        $linea = 1;

        while (($row = fgetcsv($fh)) !== false) {
            $linea++;
            $get = fn ($i) => $i !== null && isset($row[$i]) ? trim($row[$i]) : '';

            $movimientos = [];
            foreach ($mapa['cuentas'] as $idx => $slug) {
                $monto = $this->monto($get($idx));
                if ($monto !== null && abs($monto) > 0.001) {
                    $movimientos[] = ['slug' => $slug, 'amount' => $monto];
                }
            }

            if (!$movimientos) {
                continue; // fila sin plata: separador, resto del bloque de resumen, etc.
            }

            $filas[] = [
                'linea' => $linea,
                'date' => $this->fecha($get($mapa['fecha'])),
                'external_id' => $get($mapa['id']) ?: null,
                'nombre' => $get($mapa['nombre']) ?: null,
                'cajero' => $get($mapa['cajero']) ?: null,
                'asunto' => $get($mapa['asunto']) ?: null,
                'movimientos' => $movimientos,
            ];
        }

        fclose($fh);

        return [
            'filas' => $filas,
            'columnas' => array_values($mapa['cuentas']),
            'cuentas_desconocidas' => $mapa['desconocidas'],
        ];
    }

    /**
     * Ubica cada columna por su encabezado. La columna del nombre del cliente
     * no tiene titulo en la planilla: es la que sigue al ID.
     */
    private function mapearColumnas(array $encabezado): array
    {
        $mapa = ['fecha' => null, 'id' => null, 'nombre' => null, 'cajero' => null,
                 'asunto' => null, 'cuentas' => [], 'desconocidas' => []];

        foreach ($encabezado as $i => $titulo) {
            $t = BankStore::normalizeName($titulo);

            if ($t === '') {
                continue;
            }

            match (true) {
                $t === 'fecha' => $mapa['fecha'] = $i,
                $t === 'id' => $mapa['id'] = $i,
                $t === 'cajero' => $mapa['cajero'] = $i,
                $t === 'asunto' => $mapa['asunto'] = $i,
                isset(self::COLUMNAS_CUENTA[$t]) => $mapa['cuentas'][$i] = self::COLUMNAS_CUENTA[$t],
                default => $mapa['desconocidas'][$i] = trim($titulo),
            };
        }

        if ($mapa['id'] !== null) {
            $mapa['nombre'] = $mapa['id'] + 1;
        }

        // Lo que esta a la izquierda de FECHA es el bloque de saldos que la hoja
        // lleva al costado, no el libro de movimientos. No se importa ni se
        // reporta como columna perdida.
        if ($mapa['fecha'] !== null) {
            $mapa['desconocidas'] = array_filter(
                $mapa['desconocidas'],
                fn ($i) => $i > $mapa['fecha'],
                ARRAY_FILTER_USE_KEY
            );
        }

        $mapa['desconocidas'] = array_values($mapa['desconocidas']);

        return $mapa;
    }

    /**
     * "$8.220" / "-$10.000" / "10000" -> float. Formato chileno: el punto
     * separa miles y la coma decimales.
     */
    private function monto(string $s): ?float
    {
        $s = trim($s);

        if ($s === '' || $s === '-' || $s === '$') {
            return null;
        }

        $negativo = str_starts_with($s, '-') || (str_starts_with($s, '(') && str_ends_with($s, ')'));
        $limpio = preg_replace('/[^0-9,.]/', '', $s);

        if ($limpio === '') {
            return null;
        }

        $limpio = str_replace(['.', ','], ['', '.'], $limpio);

        if (!is_numeric($limpio)) {
            return null;
        }

        return $negativo ? -(float) $limpio : (float) $limpio;
    }

    private function fecha(string $s): ?string
    {
        $s = trim($s);

        if (!preg_match('#^(\d{1,2})/(\d{1,2})/(\d{4})$#', $s)) {
            return null;
        }

        try {
            return Carbon::createFromFormat('d/m/Y', $s)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Busca al cliente por su ID de la planilla; si no lo encuentra, por nombre
     * normalizado. Si tampoco, lo crea.
     */
    private function resolverCliente(?string $externalId, ?string $nombre): ?int
    {
        if (!$externalId && !$nombre) {
            return null;
        }

        $normalizado = BankStore::normalizeName($nombre);
        $clientes = collect($this->store->all(BankStore::CLIENTS));

        if ($externalId) {
            $existente = $clientes->first(fn ($c) => (string) ($c['external_id'] ?? '') === $externalId);

            if ($existente) {
                return (int) ($existente['merged_into_id'] ?: $existente['id']);
            }
        }

        if ($normalizado !== '') {
            $existente = $clientes->first(fn ($c) => ($c['normalized_name'] ?? '') === $normalizado);

            if ($existente) {
                // La ficha existia sin ID y la planilla ahora lo trae
                if ($externalId && empty($existente['external_id'])) {
                    $this->store->update(BankStore::CLIENTS, $existente['id'], ['external_id' => $externalId]);
                }

                return (int) ($existente['merged_into_id'] ?: $existente['id']);
            }
        }

        $nuevo = $this->store->insert(BankStore::CLIENTS, [
            'external_id' => $externalId,
            'name' => $nombre ?: ('Cliente ' . $externalId),
            'normalized_name' => $normalizado ?: BankStore::normalizeName('Cliente ' . $externalId),
            'is_active' => true,
            'notes' => null,
            'merged_into_id' => null,
        ]);

        return (int) $nuevo['id'];
    }

    /**
     * Si la ficha a la que fue a parar el movimiento se llama distinto de lo
     * que decia la planilla, devuelve ese otro nombre.
     *
     * Pasa cuando el ID resuelve a un cliente que ya existe: casi siempre es un
     * tipeo ("luis coralees"), pero en la planilla de septiembre habia tambien
     * dos personas distintas bajo el mismo ID. Sin esto, esa segunda persona
     * desaparecia dentro de la ficha de la primera sin dejar rastro.
     */
    private function nombreDistinto(?int $clientId, ?string $nombrePlanilla): ?string
    {
        if (!$clientId || !$nombrePlanilla) {
            return null;
        }

        $ficha = $this->store->find(BankStore::CLIENTS, $clientId);

        if (!$ficha) {
            return null;
        }

        $delaFicha = $ficha['normalized_name'] ?? BankStore::normalizeName($ficha['name']);

        return BankStore::normalizeName($nombrePlanilla) === $delaFicha ? null : trim($nombrePlanilla);
    }

    /** Nombre del cajero en la planilla -> usuario del sistema. */
    private function mapaCajeros(): array
    {
        $mapa = [];

        foreach (User::get(['id', 'username', 'first_name']) as $u) {
            foreach ([$u->username, $u->first_name] as $clave) {
                $clave = Str::lower(trim((string) $clave));

                if ($clave !== '' && !isset($mapa[$clave])) {
                    $mapa[$clave] = $u->id;
                }
            }
        }

        return $mapa;
    }

    /** Lo que hay que mirar antes de confirmar la importación. */
    private function problemas(array $filas): array
    {
        $sinFecha = array_filter($filas, fn ($f) => $f['date'] === null);
        $sinId = array_filter($filas, fn ($f) => !$f['external_id']);
        $sinNombre = array_filter($filas, fn ($f) => !$f['nombre']);
        $cajeros = array_unique(array_filter(array_column($filas, 'cajero')));
        $conocidos = $this->mapaCajeros();
        $sinUsuario = array_values(array_filter($cajeros, fn ($c) => !isset($conocidos[Str::lower($c)])));

        $total = fn ($subset) => array_sum(array_map(
            fn ($f) => array_sum(array_column($f['movimientos'], 'amount')),
            $subset
        ));

        return [
            'sin_fecha' => [
                'filas' => count($sinFecha),
                'monto' => $total($sinFecha),
                'lineas' => array_slice(array_column($sinFecha, 'linea'), 0, 20),
            ],
            'sin_id' => ['filas' => count($sinId), 'monto' => $total($sinId)],
            'sin_nombre' => ['filas' => count($sinNombre), 'monto' => $total($sinNombre)],
            'cajeros_sin_usuario' => $sinUsuario,
        ];
    }

    /**
     * Clientes de la planilla que todavia no existen, y contra que ficha
     * parecida hay que mirarlos antes de crear un duplicado.
     */
    private function clientesNuevos(array $filas): array
    {
        $existentes = collect($this->store->all(BankStore::CLIENTS));
        $idsExistentes = $existentes->filter(fn ($c) => !empty($c['external_id']))
            ->keyBy(fn ($c) => (string) $c['external_id']);
        $nombresExistentes = $existentes->keyBy(fn ($c) => $c['normalized_name'] ?? '');

        $nuevos = [];

        foreach ($filas as $f) {
            $norm = BankStore::normalizeName($f['nombre']);

            if ($norm === '' && !$f['external_id']) {
                continue;
            }

            if (($f['external_id'] && $idsExistentes->has($f['external_id'])) || $nombresExistentes->has($norm)) {
                continue;
            }

            $clave = $f['external_id'] . '|' . $norm;

            if (isset($nuevos[$clave])) {
                $nuevos[$clave]['movs']++;
                continue;
            }

            // Contra que se parece: sirve para cazar "cludia cabello" antes de
            // que entre como cliente aparte de "claudia cabello"
            $parecidos = [];

            foreach ($nombresExistentes->keys() as $otro) {
                if (!$otro || !$norm) {
                    continue;
                }

                similar_text($norm, $otro, $porcentaje);

                if ($porcentaje >= 82) {
                    $parecidos[] = $nombresExistentes[$otro]['name'];
                }
            }

            $nuevos[$clave] = [
                'external_id' => $f['external_id'],
                'nombre' => $f['nombre'],
                'movs' => 1,
                'parecidos' => array_slice($parecidos, 0, 3),
            ];
        }

        $lista = array_values($nuevos);
        usort($lista, fn ($a, $b) => $b['movs'] <=> $a['movs']);

        return $lista;
    }
}
