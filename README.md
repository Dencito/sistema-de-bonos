# Proyecto de Gestión de Bonos y Tickets

## Descripción

Este proyecto es una aplicación web para la gestión de bonos y tickets, diseñada para facilitar la administración de procesos relacionados con la distribución y seguimiento de bonos en diversas categorías. La aplicación permite a los usuarios gestionar empresas, sucursales, categorías de bonos, usuarios y roles, todo en una interfaz intuitiva y responsive.

## Funcionalidades

- **Gestión de Empresas**: Permite a los usuarios crear y gestionar varias empresas, facilitando la administración de bonos a nivel organizativo.
  
- **Gestión de Sucursales**: Los usuarios pueden añadir sucursales a las empresas, y gestionar los bonos asociados a cada una.

- **Categorías de Bonos**: Organiza los bonos en distintas categorías para una fácil búsqueda y administración.

- **Creación y Seguimiento de Bonos**: Los usuarios pueden crear nuevos bonos, asignarles un estado y hacer un seguimiento del uso de cada bono.

- **Interfaz Intuitiva**: Desarrollada en React, la interfaz es amigable y responsiva, garantizando una experiencia de usuario fluida.

- **Sistema de Roles y Permisos**: Utilizando el paquete Spatie, la aplicación implementa un sistema robusto de roles y permisos para controlar el acceso a distintas funcionalidades.

- **Filtros Avanzados**: Permite a los usuarios filtrar bonos y tickets por estado, categoría y sucursal, mejorando la experiencia de búsqueda.

- **Reportes Generales**: Genera reportes detallados sobre el uso de bonos, permitiendo a los administradores tener un control total sobre la gestión.

- **Autenticación Segura**: Implementa un sistema de autenticación usando Laravel Sanctum, garantizando la seguridad de los datos de los usuarios.

## Tecnologías Utilizadas

- **Backend**: Laravel 11
- **Frontend**: React.js
- **Base de Datos**: MySQL
- **Estilos**: Tailwind CSS, Ant Design
- **Gestión de Roles**: Spatie Laravel Permission

## Instalación

Para configurar el proyecto en tu entorno local, sigue estos pasos:

### Requisitos Previos

Asegúrate de tener instalados los siguientes componentes:

- PHP (versión 8.0 o superior)
- Composer
- MySQL (versión 5.7 o superior)
- Node.js (versión 14 o superior)
- npm (Node Package Manager)

### Pasos de Instalación

1. **Clona el repositorio:**
    - Abre tu terminal y ejecuta el siguiente comando para clonar el repositorio:
    ```bash
   git clone https://github.com/Dencito/sistema-de-bonos

2. **Navega al directorio del proyecto:**
   - Cambia al directorio del proyecto clonado:
     ```bash
     cd tu_repositorio
     ```

3. **Instala las dependencias del backend:**
   - Ejecuta el siguiente comando para instalar las dependencias de Laravel:
     ```bash
     composer install
     ```

4. **Configura tu archivo `.env`:**
   - Copia el archivo de ejemplo para crear tu archivo `.env`:
     ```bash
     cp .env.example .env
     ```
   - Abre el archivo `.env` en un editor de texto y configura la conexión a tu base de datos MySQL. Modifica los siguientes campos:
     ```env
     DB_CONNECTION=mysql
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=nombre_de_tu_base_de_datos
     DB_USERNAME=tu_usuario
     DB_PASSWORD=tu_contraseña
     ```

5. **Ejecuta las migraciones:**
   - Ejecuta el siguiente comando para crear las tablas necesarias en tu base de datos:
     ```bash
     php artisan migrate
     ```

6. **Instala las dependencias del frontend:**
   - Instala las dependencias utilizando npm:
     ```bash
     npm install
     ```

7. **Ejecuta el servidor de desarrollo:**
   - Para iniciar la el frontend, ejecuta:
     ```bash
     npm run dev
     ```

### Acceso a la Aplicación

- Una vez que el servidor esté en funcionamiento, abre tu navegador y accede a `http://localhost:8000` para ver la aplicación en acción.

---
