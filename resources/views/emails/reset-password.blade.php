<!DOCTYPE html>
<html>
<head>
    <title>Recuperación de Contraseña</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Recuperación de Contraseña</h2>
        
        <p>Hola,</p>
        
        <p>Has recibido este correo porque hemos recibido una solicitud de restablecimiento de contraseña para tu cuenta.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetLink }}" 
               style="background: #4F46E5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Restablecer Contraseña
            </a>
        </div>
        
        <p>Este enlace de restablecimiento de contraseña caducará en 60 minutos.</p>
        
        <p>Si no solicitaste un restablecimiento de contraseña, no es necesario realizar ninguna acción.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px; text-align: center;">
            Si tienes problemas para hacer clic en el botón "Restablecer Contraseña", 
            copia y pega la siguiente URL en tu navegador web: <br>
            {{ $resetLink }}
        </p>
    </div>
</body>
</html>
