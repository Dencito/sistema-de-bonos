<?php

namespace App\Services;

use Illuminate\Support\Facades\Hash;

/**
 * Credenciales de la consola de plataforma (/create-company).
 *
 * Viven en storage/app/platform-admins.json, fuera del document root: lo unico
 * que se sirve por web de storage/app es la carpeta public via symlink, asi que
 * el archivo no es alcanzable desde el navegador. Ademas storage/app/.gitignore
 * tiene "*", asi que nunca se sube al repositorio.
 *
 * Solo se guardan hashes bcrypt. La contrasenia en claro no queda en ningun
 * lado: si se pierde, se rota con `php artisan platform:admin`.
 *
 * Es a proposito un mecanismo aparte de la tabla users: crear empresas es una
 * operacion de plataforma, por encima de cualquier tenant, y no deberia
 * depender de que exista un usuario en las tablas de un tenant.
 */
class PlatformAdminService
{
    public const SESSION_KEY = 'platform_admin';

    private function path(): string
    {
        return storage_path('app/platform-admins.json');
    }

    /**
     * Valida usuario y contrasenia contra el archivo.
     * Devuelve el nombre de usuario si son correctos, null si no.
     */
    public function attempt(string $user, string $password): ?string
    {
        foreach ($this->admins() as $admin) {
            $name = $admin['user'] ?? null;
            $hash = $admin['password_hash'] ?? null;

            if (!$name || !$hash || !hash_equals($name, $user)) {
                continue;
            }

            // Hash::check ya es de tiempo constante
            return Hash::check($password, $hash) ? $name : null;
        }

        return null;
    }

    /**
     * Guarda o reemplaza un admin con la contrasenia dada.
     */
    public function put(string $user, string $password): void
    {
        $admins = array_values(array_filter(
            $this->admins(),
            fn ($a) => ($a['user'] ?? null) !== $user
        ));

        $admins[] = [
            'user' => $user,
            'password_hash' => Hash::make($password),
        ];

        $payload = [
            '_nota' => 'Credenciales de la consola de plataforma (/create-company). Solo hashes: la contrasenia en claro no se guarda. Rotar con: php artisan platform:admin',
            'admins' => $admins,
        ];

        file_put_contents(
            $this->path(),
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL
        );
    }

    public function configured(): bool
    {
        return count($this->admins()) > 0;
    }

    private function admins(): array
    {
        $path = $this->path();

        if (!is_readable($path)) {
            return [];
        }

        $data = json_decode((string) file_get_contents($path), true);

        return is_array($data['admins'] ?? null) ? $data['admins'] : [];
    }
}
