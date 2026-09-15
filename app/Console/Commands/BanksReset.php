<?php

namespace App\Console\Commands;

use App\Services\BankStore;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Deja la caja de bancos online en cero para empezar a operar de verdad.
 *
 * Borra turnos, movimientos, importaciones y pone en cero el saldo inicial de
 * cada cuenta. Por defecto conserva las cuentas, los tipos y los clientes:
 * son el catalogo, no el movimiento.
 *
 * Antes de tocar nada deja una copia en storage/app/banks-backups, asi que
 * siempre se puede volver atras.
 */
class BanksReset extends Command
{
    protected $signature = 'banks:reset
        {--empresa= : Prefijo de la empresa. Si no se pasa, pregunta}
        {--con-clientes : Borra también los clientes}
        {--con-cuentas : Borra también las cuentas y los tipos (vuelven los 8 y 4 de fábrica)}
        {--force : No pide confirmación}';

    protected $description = 'Deja la caja de bancos online en cero (hace copia antes)';

    public function handle(): int
    {
        $empresa = $this->option('empresa');

        if (!$empresa) {
            $disponibles = $this->empresasConDatos();

            if (!$disponibles) {
                $this->warn('No hay datos de bancos en storage/app/banks.');

                return self::SUCCESS;
            }

            $empresa = $this->choice('¿Qué empresa?', $disponibles);
        }

        $store = new BankStore($empresa);

        if (!File::isDirectory($store->directorio())) {
            $this->error("No hay datos de bancos para la empresa '{$empresa}'.");

            return self::FAILURE;
        }

        // Qué se va a borrar, para que la confirmación sea informada
        $conteos = [];
        foreach (BankStore::COLECCIONES as $coleccion) {
            $conteos[$coleccion] = count($store->all($coleccion));
        }

        $this->line("Empresa: <info>{$empresa}</info>");
        foreach ($conteos as $coleccion => $n) {
            $this->line(sprintf('  %-11s %d', $coleccion, $n));
        }

        $aBorrar = [BankStore::MOVEMENTS, BankStore::SHIFTS, BankStore::IMPORTS];

        if ($this->option('con-clientes')) {
            $aBorrar[] = BankStore::CLIENTS;
        }

        if ($this->option('con-cuentas')) {
            $aBorrar[] = BankStore::ACCOUNTS;
            $aBorrar[] = BankStore::KINDS;
        }

        $this->newLine();
        $this->line('Se va a vaciar: <comment>' . implode(', ', $aBorrar) . '</comment>');
        $this->line('El saldo inicial de cada cuenta queda en <comment>0</comment>.');

        if (!$this->option('force') && !$this->confirm('¿Seguimos?', false)) {
            $this->info('Cancelado. No se tocó nada.');

            return self::SUCCESS;
        }

        // Copia antes de tocar nada
        $copia = storage_path('app/banks-backups/' . $empresa . '-' . now()->format('Ymd-His'));
        File::ensureDirectoryExists($copia);
        File::copyDirectory($store->directorio(), $copia);
        $this->line("Copia guardada en: <info>{$copia}</info>");

        foreach ($aBorrar as $coleccion) {
            $store->save($coleccion, []);
        }

        // Las cuentas que sobreviven arrancan en cero
        if (!$this->option('con-cuentas')) {
            foreach ($store->all(BankStore::ACCOUNTS) as $cuenta) {
                $store->update(BankStore::ACCOUNTS, $cuenta['id'], ['initial_balance' => 0]);
            }
        }

        // Borrar el archivo hace que BankStore vuelva a sembrar los de fábrica
        if ($this->option('con-cuentas')) {
            foreach ([BankStore::ACCOUNTS, BankStore::KINDS] as $coleccion) {
                File::delete($store->archivo($coleccion));
            }
        }

        $this->newLine();
        $this->info("Listo: la caja de bancos de '{$empresa}' quedó en cero.");
        $this->line('Abrí un turno y cargá los saldos reales de cada cuenta en la apertura.');

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
}
