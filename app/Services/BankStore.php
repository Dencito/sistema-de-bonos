<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

/**
 * Almacenamiento en JSON del modulo de bancos.
 *
 * Mientras el esquema no este cerrado, los bancos viven en archivos y no en la
 * base. La forma de cada registro es exactamente la de la tabla que va a existir
 * despues (mismos campos, mismos nombres), asi que pasar a MySQL es correr el
 * .sql y cambiar de capa: `php artisan banks:export-sql` genera los INSERT.
 *
 * Los archivos van separados por empresa, igual que el prefijo de tablas:
 *   storage/app/banks/{empresa}/movements.json
 */
class BankStore
{
    public const ACCOUNTS = 'accounts';
    public const CLIENTS = 'clients';
    public const MOVEMENTS = 'movements';
    public const IMPORTS = 'imports';
    public const KINDS = 'kinds';
    public const SHIFTS = 'shifts';

    public const COLECCIONES = [
        self::ACCOUNTS,
        self::CLIENTS,
        self::MOVEMENTS,
        self::IMPORTS,
        self::KINDS,
        self::SHIFTS,
    ];

    /**
     * Que le hace a la cuenta cada tipo de movimiento.
     *
     * El signo no es cosmetico: define si el monto suma o resta del saldo. Por
     * eso un tipo nuevo tiene que declararlo, no alcanza con el nombre.
     */
    public const SIGNO_ENTRA = 'in';        // siempre suma
    public const SIGNO_SALE = 'out';        // siempre resta
    public const SIGNO_SEGUN_MONTO = 'both'; // lo decide el signo que se escriba
    public const SIGNO_TRASPASO = 'transfer'; // dos patas: sale de una cuenta y entra en otra

    public const SIGNOS = [
        self::SIGNO_ENTRA => 'Suma a la cuenta (ingreso)',
        self::SIGNO_SALE => 'Resta de la cuenta (egreso)',
        self::SIGNO_SEGUN_MONTO => 'Según el monto que se escriba',
        self::SIGNO_TRASPASO => 'Traspaso entre dos cuentas',
    ];

    /** Los cuatro que trae el sistema. No se pueden borrar. */
    private const TIPOS_INICIALES = [
        ['name' => 'Carga', 'slug' => 'carga', 'sign' => self::SIGNO_ENTRA, 'sort_order' => 1],
        ['name' => 'Retiro', 'slug' => 'retiro', 'sign' => self::SIGNO_SALE, 'sort_order' => 2],
        ['name' => 'Traspaso entre cuentas', 'slug' => 'traspaso', 'sign' => self::SIGNO_TRASPASO, 'sort_order' => 3],
        ['name' => 'Ajuste', 'slug' => 'ajuste', 'sign' => self::SIGNO_SEGUN_MONTO, 'sort_order' => 4],
    ];

    /** Las mismas cuentas que siembra add_bank_module.sql. */
    private const CUENTAS_INICIALES = [
        ['name' => 'Estado Friendly', 'slug' => 'friendly', 'sort_order' => 1],
        ['name' => 'BCI', 'slug' => 'bci', 'sort_order' => 2],
        ['name' => 'Banco Falabella', 'slug' => 'falabella', 'sort_order' => 3],
        ['name' => 'Banco Rentamania', 'slug' => 'rentamania', 'sort_order' => 4],
        ['name' => 'Cuenta RUT', 'slug' => 'cuenta_rut', 'sort_order' => 5],
        ['name' => 'Ahorro', 'slug' => 'ahorro', 'sort_order' => 6],
        ['name' => 'Menta Limon', 'slug' => 'chile', 'sort_order' => 7],
        ['name' => 'Efectivo', 'slug' => 'efectivo', 'sort_order' => 8],
    ];

    private ?string $empresa;

    /** Cache por request: evita releer el archivo en cada consulta. */
    private array $cache = [];

    public function __construct(?string $empresa = null)
    {
        $this->empresa = $empresa ?: (config('company.prefix') ?: 'default');
    }

    public function empresa(): string
    {
        return $this->empresa;
    }

    public function directorio(): string
    {
        return storage_path('app/banks/' . $this->empresa);
    }

    public function archivo(string $coleccion): string
    {
        return $this->directorio() . '/' . $coleccion . '.json';
    }

    /**
     * Todos los registros de una coleccion.
     */
    public function all(string $coleccion): array
    {
        if (isset($this->cache[$coleccion])) {
            return $this->cache[$coleccion];
        }

        $ruta = $this->archivo($coleccion);

        if (!File::exists($ruta)) {
            $inicial = match ($coleccion) {
                self::ACCOUNTS => $this->semilla(self::CUENTAS_INICIALES, ['initial_balance' => 0, 'is_active' => true]),
                self::KINDS => $this->semilla(self::TIPOS_INICIALES, ['is_system' => true, 'is_active' => true]),
                default => [],
            };
            $this->save($coleccion, $inicial);

            return $this->cache[$coleccion] = $inicial;
        }

        $contenido = File::get($ruta);
        $datos = json_decode($contenido, true);

        if (!is_array($datos)) {
            throw new \RuntimeException("El archivo {$coleccion}.json está corrupto o no es un JSON válido");
        }

        return $this->cache[$coleccion] = $datos;
    }

    public function save(string $coleccion, array $registros): void
    {
        File::ensureDirectoryExists($this->directorio());

        $json = json_encode(
            array_values($registros),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        // Escritura atomica: se arma aparte y recien ahi se reemplaza, asi un
        // corte a mitad de camino no deja el archivo por la mitad.
        $temporal = $this->archivo($coleccion) . '.tmp';
        File::put($temporal, $json);
        File::move($temporal, $this->archivo($coleccion));

        $this->cache[$coleccion] = array_values($registros);
    }

    public function find(string $coleccion, $id): ?array
    {
        foreach ($this->all($coleccion) as $registro) {
            if ((int) $registro['id'] === (int) $id) {
                return $registro;
            }
        }

        return null;
    }

    /**
     * Inserta asignando id y timestamps, como haria la base.
     */
    public function insert(string $coleccion, array $datos): array
    {
        $registros = $this->all($coleccion);
        $ahora = now()->toIso8601String();

        $datos['id'] = $this->siguienteId($registros);
        $datos['created_at'] ??= $ahora;
        $datos['updated_at'] = $ahora;

        $registros[] = $datos;
        $this->save($coleccion, $registros);

        return $datos;
    }

    /** Inserta varios de una, sin reescribir el archivo en cada uno. */
    public function insertMany(string $coleccion, array $filas): array
    {
        $registros = $this->all($coleccion);
        $ahora = now()->toIso8601String();
        $id = $this->siguienteId($registros);
        $nuevos = [];

        foreach ($filas as $fila) {
            $fila['id'] = $id++;
            $fila['created_at'] ??= $ahora;
            $fila['updated_at'] = $ahora;
            $registros[] = $fila;
            $nuevos[] = $fila;
        }

        $this->save($coleccion, $registros);

        return $nuevos;
    }

    public function update(string $coleccion, $id, array $datos): ?array
    {
        $registros = $this->all($coleccion);
        $actualizado = null;

        foreach ($registros as $i => $registro) {
            if ((int) $registro['id'] === (int) $id) {
                $actualizado = array_merge($registro, $datos, [
                    'id' => (int) $registro['id'],
                    'updated_at' => now()->toIso8601String(),
                ]);
                $registros[$i] = $actualizado;
                break;
            }
        }

        if ($actualizado === null) {
            return null;
        }

        $this->save($coleccion, $registros);

        return $actualizado;
    }

    /** Actualiza todos los que cumplan la condicion. Devuelve cuantos toco. */
    public function updateWhere(string $coleccion, callable $condicion, array $datos): int
    {
        $registros = $this->all($coleccion);
        $ahora = now()->toIso8601String();
        $tocados = 0;

        foreach ($registros as $i => $registro) {
            if ($condicion($registro)) {
                $registros[$i] = array_merge($registro, $datos, [
                    'id' => (int) $registro['id'],
                    'updated_at' => $ahora,
                ]);
                $tocados++;
            }
        }

        if ($tocados) {
            $this->save($coleccion, $registros);
        }

        return $tocados;
    }

    public function delete(string $coleccion, $id): bool
    {
        return $this->deleteWhere($coleccion, fn ($r) => (int) $r['id'] === (int) $id) > 0;
    }

    public function deleteWhere(string $coleccion, callable $condicion): int
    {
        $registros = $this->all($coleccion);
        $quedan = array_values(array_filter($registros, fn ($r) => !$condicion($r)));
        $borrados = count($registros) - count($quedan);

        if ($borrados) {
            $this->save($coleccion, $quedan);
        }

        return $borrados;
    }

    /**
     * Corre el callback y, si algo revienta, deja los archivos como estaban.
     * Es el reemplazo de DB::transaction mientras los datos viven en JSON.
     */
    public function transaction(callable $callback, array $colecciones = self::COLECCIONES)
    {
        $respaldo = [];
        foreach ($colecciones as $coleccion) {
            $respaldo[$coleccion] = $this->all($coleccion);
        }

        try {
            return $callback();
        } catch (\Throwable $e) {
            foreach ($respaldo as $coleccion => $registros) {
                $this->save($coleccion, $registros);
            }

            throw $e;
        }
    }

    /**
     * Nombre comparable: sin tildes, sin puntuacion, sin dobles espacios.
     * Es lo que permite cazar "cludia cabello" contra "claudia cabello".
     */
    public static function normalizeName(?string $nombre): string
    {
        $s = mb_strtolower(trim((string) $nombre));
        $s = strtr($s, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
            'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
            'ñ' => 'n',
        ]);
        $s = preg_replace('/[^a-z0-9 ]/', '', $s);

        return trim(preg_replace('/\s+/', ' ', $s));
    }

    private function siguienteId(array $registros): int
    {
        $ids = array_map(fn ($r) => (int) ($r['id'] ?? 0), $registros);

        return ($ids ? max($ids) : 0) + 1;
    }

    /** Arma los registros de arranque de una colección, con id y timestamps. */
    private function semilla(array $filas, array $extra): array
    {
        $ahora = now()->toIso8601String();

        return array_map(fn ($fila, $i) => array_merge($fila, $extra, [
            'id' => $i + 1,
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ]), $filas, array_keys($filas));
    }
}
