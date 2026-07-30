<?php

namespace App\Console\Commands;

use App\Services\PlatformAdminService;
use Illuminate\Console\Command;

class PlatformAdminCommand extends Command
{
    protected $signature = 'platform:admin
                            {user? : Nombre de usuario}
                            {--password= : Contrasenia. Si se omite se genera una al azar.}';

    protected $description = 'Crea o rota una credencial de la consola de plataforma (/create-company)';

    public function handle(PlatformAdminService $admins): int
    {
        $user = $this->argument('user') ?: $this->ask('Usuario');

        if (!$user) {
            $this->error('Hace falta un usuario.');
            return self::FAILURE;
        }

        $password = $this->option('password');
        $generated = false;

        if (!$password) {
            $password = $this->generatePassword();
            $generated = true;
        }

        $admins->put($user, $password);

        $this->info('Credencial guardada en storage/app/platform-admins.json (solo el hash).');
        $this->line('  usuario:  ' . $user);

        if ($generated) {
            $this->line('  password: ' . $password);
            $this->newLine();
            $this->warn('Anotala ahora: no se guarda en claro y no se puede recuperar.');
        }

        return self::SUCCESS;
    }

    private function generatePassword(int $length = 20): string
    {
        // Sin caracteres ambiguos (l, I, 1, O, 0) para poder dictarla sin errores
        $alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $password = '';

        for ($i = 0; $i < $length; $i++) {
            $password .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        return $password;
    }
}
