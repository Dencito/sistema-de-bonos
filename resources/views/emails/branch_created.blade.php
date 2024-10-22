<!DOCTYPE html>
<html>
<head>
    <title>Nueva Sucursal Creada</title>
</head>
<body>
    <p>El usuario: {{ $username }} creó una sucursal para la empresa: {{ $companyName }}.</p>
    <p>Nombre de la sucursal: {{ $branch->name }}</p>
    <p>Gracias por usar nuestra aplicación!</p>
</body>
</html>