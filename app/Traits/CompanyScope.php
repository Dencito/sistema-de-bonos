<?php

namespace App\Traits;

trait CompanyScope
{
    public function getTable()
    {
        // Obtener el prefijo de la empresa desde la configuración
        $prefix = config('company.prefix');
        
        // Si no hay prefijo, usar el nombre de tabla normal
        if (!$prefix) {
            return parent::getTable();
        }

        // Si la tabla ya tiene el prefijo, devolverla como está
        if (str_starts_with(parent::getTable(), $prefix . '_')) {
            return parent::getTable();
        }

        // Añadir el prefijo a la tabla
        return $prefix . '_' . parent::getTable();
    }
}
