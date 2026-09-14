<?php

namespace App\Console\Commands;

use App\Services\BankStore;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Convierte los JSON del modulo de bancos en INSERTs listos para correr.
 *
 * Es el puente para el dia que se pase a la base: se corre add_bank_module.sql
 * (crea las tablas) y despues el archivo que genera este comando (mete los
 * datos). Los ids se respetan tal cual, asi que las referencias entre
 * movimientos, cuentas y clientes siguen valiendo.
 */
class BanksExportSql extends Command
{
    protected $signature = 'banks:export-sql
        {--empresa= : Prefijo de la empresa (por defecto, todas las que tengan JSON)}
        {--salida= : Archivo .sql a generar}';

    protected $description = 'Genera los INSERT de bancos a partir de los JSON';

    /** Columnas de cada tabla, en el orden en que van al INSERT. */
    private const COLUMNAS = [
        BankStore::ACCOUNTS => ['id', 'name', 'slug', 'initial_balance', 'is_active', 'sort_order', 'created_at', 'updated_at'],
        BankStore::CLIENTS => ['id', 'external_id', 'name', 'normalized_name', 'is_active', 'notes', 'merged_into_id', 'created_at', 'updated_at'],
        BankStore::SHIFTS => ['id', 'opened_by', 'opened_at', 'closed_by', 'closed_at', 'is_active', 'source', 'opening_note', 'closing_note', 'opening_balances', 'proposed_balances', 'created_at', 'updated_at'],
        BankStore::KINDS => ['id', 'name', 'slug', 'sign', 'is_system', 'is_active', 'sort_order', 'created_at', 'updated_at'],
        BankStore::MOVEMENTS => ['id', 'date', 'bank_shift_id', 'bank_account_id', 'bank_client_id', 'user_id', 'amount', 'kind', 'description', 'transfer_group_id', 'bank_import_id', 'edit_history', 'created_at', 'updated_at'],
        BankStore::IMPORTS => ['id', 'filename', 'rows_total', 'rows_imported', 'rows_skipped', 'period_start', 'period_end', 'user_id', 'notes', 'created_at', 'updated_at'],
    ];

    /** Coleccion -> tabla. Se insertan en este orden por las claves foraneas. */
    private const TABLAS = [
        BankStore::ACCOUNTS => 'bank_accounts',
        BankStore::KINDS => 'bank_kinds',
        BankStore::SHIFTS => 'bank_shifts',
        BankStore::CLIENTS => 'bank_clients',
        BankStore::IMPORTS => 'bank_imports',
        BankStore::MOVEMENTS => 'bank_movements',
    ];

    public function handle(): int
    {
        $empresas = $this->option('empresa')
            ? [$this->option('empresa')]
            : $this->empresasConDatos();

        if (!$empresas) {
            $this->warn('No hay datos de bancos en storage/app/banks. Nada para exportar.');

            return self::SUCCESS;
        }

        $salida = $this->option('salida') ?: base_path('bank_module_data.sql');
        $sql = "-- Datos del módulo de bancos exportados desde los JSON\n"
             . '-- Generado el ' . now()->format('d/m/Y H:i') . "\n"
             . "-- Correr DESPUÉS de add_bank_module.sql, que es el que crea las tablas.\n";

        $totales = [];

        foreach ($empresas as $empresa) {
            $store = new BankStore($empresa);
            $sql .= "\n-- ------------------------------------------------------------\n";
            $sql .= "-- {$empresa}\n";
            $sql .= "-- ------------------------------------------------------------\n";

            foreach (self::TABLAS as $coleccion => $tabla) {
                $registros = $store->all($coleccion);

                if (!$registros) {
                    continue;
                }

                $sql .= $this->insertsDe($empresa . '_' . $tabla, self::COLUMNAS[$coleccion], $registros);
                $totales[$empresa][$tabla] = count($registros);
            }
        }

        File::put($salida, $sql);

        $this->info("Escrito: {$salida}");

        foreach ($totales as $empresa => $tablas) {
            foreach ($tablas as $tabla => $n) {
                $this->line("  {$empresa}.{$tabla}: {$n} registro(s)");
            }
        }

        return self::SUCCESS;
    }

    private function empresasConDatos(): array
    {
        $raiz = storage_path('app/banks');

        if (!File::isDirectory($raiz)) {
            return [];
        }

        return array_map(fn ($d) => basename($d), File::directories($raiz));
    }

    /**
     * Un INSERT por cada 200 filas: un solo INSERT gigante con miles de filas
     * se choca con max_allowed_packet.
     */
    private function insertsDe(string $tabla, array $columnas, array $registros): string
    {
        $sql = "\n";
        $lista = '`' . implode('`, `', $columnas) . '`';

        foreach (array_chunk($registros, 200) as $lote) {
            $filas = array_map(
                fn ($r) => '    (' . implode(', ', array_map(fn ($c) => $this->valor($r[$c] ?? null), $columnas)) . ')',
                $lote
            );

            $sql .= "INSERT INTO `{$tabla}` ({$lista}) VALUES\n"
                 . implode(",\n", $filas) . ";\n";
        }

        return $sql;
    }

    private function valor($v): string
    {
        if ($v === null || $v === '') {
            return 'NULL';
        }

        if (is_bool($v)) {
            return $v ? '1' : '0';
        }

        if (is_int($v) || is_float($v)) {
            return (string) $v;
        }

        // edit_history y cualquier otro array van como JSON
        if (is_array($v)) {
            $v = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        // Las fechas ISO del JSON no entran en un DATETIME de MySQL
        if (is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $v)) {
            $v = substr(str_replace('T', ' ', $v), 0, 19);
        }

        return "'" . addcslashes((string) $v, "'\\") . "'";
    }
}
