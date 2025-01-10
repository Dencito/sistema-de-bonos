<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class EncryptionService
{
    public static function decryptPassword(string $encryptedPassword): ?string
    {
        $secretKey = env('APP_PASSWORD_ENCRYPTION_KEY');

        if (!$secretKey) {
            throw new \Exception('La clave de cifrado no está configurada correctamente');
        }

        $secretKey = substr($secretKey, 0, 16);

        $decoded = base64_decode($encryptedPassword);

        if (!$decoded || strlen($decoded) < 16) {
            throw new \Exception('El texto cifrado es inválido o incompleto');
        }

        // Extraer el IV (primeros 16 bytes)
        $iv = substr($decoded, 0, 16);
        $ciphertext = substr($decoded, 16);

        // Verificar longitudes del IV y ciphertext
        if (strlen($iv) !== 16) {
            throw new \Exception('El IV tiene una longitud incorrecta');
        }

        if (strlen($ciphertext) < 16) {
            throw new \Exception('El ciphertext tiene una longitud incorrecta');
        }

        Log::info('IV (Hex): ' . bin2hex($iv));
        Log::info('Ciphertext (Hex): ' . bin2hex($ciphertext));

        $decrypted = openssl_decrypt(
            $ciphertext,
            'AES-128-CBC',
            $secretKey,
            OPENSSL_RAW_DATA,  // Aseguramos el manejo correcto del padding
            $iv
        );

        if ($decrypted === false) {
            Log::error('Error al descifrar la contraseña', [
                'ciphertext' => bin2hex($ciphertext),
                'iv' => bin2hex($iv),
                'secretKey' => bin2hex($secretKey),
                'error' => openssl_error_string(),
            ]);
            throw new \Exception('Error al descifrar la contraseña');
        }

        return $decrypted;
    }
}
