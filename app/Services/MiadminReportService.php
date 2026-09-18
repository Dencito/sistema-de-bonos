<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reporte de los casinos online, leído de miadmin.cc.
 *
 * La petición sale del servidor, nunca del navegador: lleva una cookie de
 * sesión y desde el front quedaría a la vista de cualquiera que abra las
 * herramientas de desarrollo. Además el navegador la frenaría por CORS.
 *
 * La cookie caduca cada tanto. Cuando pasa, la API contesta con un 401/403 o
 * devuelve el login, así que el servicio lo detecta y avisa qué hay que hacer
 * en vez de mostrar un reporte vacío que parece un día sin movimiento.
 */
class MiadminReportService
{
    /** Lo que devuelve la API por día, y cómo lo llamamos acá. */
    private const CAMPOS = [
        'betsPlus' => 'entradas',
        'betsPlusCnt' => 'entradas_cant',
        'betsMinus' => 'salidas',
        'betsMinusCnt' => 'salidas_cant',
        'otherPlus' => 'otras_entradas',
        'otherMinus' => 'otras_salidas',
        'delta' => 'neto',
    ];

    public function configurado(): bool
    {
        return !empty(config('services.miadmin.cookie'))
            && !empty(config('services.miadmin.accounts'));
    }

    /**
     * Reporte día por día entre dos fechas, ya ordenado y con los totales.
     *
     * @throws \RuntimeException con un mensaje que se le puede mostrar al usuario
     */
    public function resumen(string $desde, string $hasta): array
    {
        if (!$this->configurado()) {
            throw new \RuntimeException(
                'Falta configurar el acceso a miadmin: revisá MIADMIN_COOKIE y MIADMIN_ACCOUNTS en el .env'
            );
        }

        $datos = $this->pedir($desde, $hasta);
        $info = $datos['info'] ?? [];

        $dias = collect($datos['report'] ?? [])
            ->map(function ($fila) use ($info) {
                $dia = ['fecha' => $fila['date'] ?? null, 'cuentas' => (int) ($fila['active_accs'] ?? 0)];

                foreach (self::CAMPOS as $origen => $nombre) {
                    $dia[$nombre] = (float) ($fila[$origen] ?? 0);
                }

                // La API manda las salidas en negativo; se respeta el signo
                $delDia = $info[$dia['fecha']] ?? [];
                $dia['moneda'] = $delDia['currency'] ?? null;
                $dia['bonus'] = (float) ($delDia['bonus'] ?? 0);

                return $dia;
            })
            ->sortBy('fecha')
            ->values();

        return [
            'desde' => $desde,
            'hasta' => $hasta,
            'moneda' => $dias->pluck('moneda')->filter()->first() ?? 'CLP',
            'dias' => $dias->all(),
            'totales' => [
                'entradas' => round($dias->sum('entradas'), 2),
                'entradas_cant' => (int) $dias->sum('entradas_cant'),
                'salidas' => round($dias->sum('salidas'), 2),
                'salidas_cant' => (int) $dias->sum('salidas_cant'),
                'otras_entradas' => round($dias->sum('otras_entradas'), 2),
                'otras_salidas' => round($dias->sum('otras_salidas'), 2),
                'neto' => round($dias->sum('neto'), 2),
                'bonus' => round($dias->sum('bonus'), 2),
                'dias' => $dias->count(),
                'dias_positivos' => $dias->where('neto', '>', 0)->count(),
                'dias_negativos' => $dias->where('neto', '<', 0)->count(),
            ],
            // Útiles para ver si el período fue bueno o malo de un vistazo
            'mejor_dia' => $dias->sortByDesc('neto')->first(),
            'peor_dia' => $dias->sortBy('neto')->first(),
        ];
    }

    private function pedir(string $desde, string $hasta): array
    {
        $base = rtrim((string) config('services.miadmin.url'), '/');

        // El parámetro r es un cache-buster: la API lo espera
        $url = $base . '/api/reports/overall?r=' . (int) (microtime(true) * 1000);

        $peticion = Http::timeout(30)
            ->withHeaders([
                'Content-Type' => 'application/json;charset=UTF-8',
                'Accept' => 'application/json, text/plain, */*',
                'Origin' => $base,
                'Referer' => $base . '/',
                // Las comillas del .env no son parte de la cookie
                'Cookie' => trim((string) config('services.miadmin.cookie'), "'\""),
            ]);

        if ($ca = config('services.miadmin.ca_bundle')) {
            $peticion = $peticion->withOptions(['verify' => $ca]);
        }

        try {
            $respuesta = $peticion->post($url, [
                'account' => config('services.miadmin.accounts'),
                'tz' => (string) config('services.miadmin.tz'),
                'start' => $desde,
                'end' => $hasta,
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo hablar con miadmin', ['error' => $e->getMessage()]);

            throw new \RuntimeException('No se pudo conectar con miadmin.cc: ' . $e->getMessage());
        }

        if (in_array($respuesta->status(), [401, 403], true)) {
            throw new \RuntimeException($this->mensajeSesionVencida());
        }

        if ($respuesta->failed()) {
            throw new \RuntimeException('miadmin.cc respondió ' . $respuesta->status());
        }

        $json = $respuesta->json();

        // Sesión vencida: muchas veces contesta 200 con el HTML del login
        if (!is_array($json) || !array_key_exists('report', $json)) {
            throw new \RuntimeException($this->mensajeSesionVencida());
        }

        return $json;
    }

    private function mensajeSesionVencida(): string
    {
        return 'La sesión de miadmin.cc venció. Hay que entrar al panel, copiar la cookie nueva '
            . 'y reemplazar MIADMIN_COOKIE en el .env del servidor.';
    }

    /** Rango por defecto: el mes en curso. */
    public static function rangoPorDefecto(): array
    {
        return [
            Carbon::now()->startOfMonth()->format('Y-m-d'),
            Carbon::now()->format('Y-m-d'),
        ];
    }
}
