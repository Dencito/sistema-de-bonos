<?php

namespace App\Traits;

trait CompanyScope
{
    public function getTable()
    {
        $prefix = config('company.prefix'); // Prefijo dinámico
        $table = parent::getTable(); // Nombre base de la tabla

        // Devuelve el nombre base si no hay prefijo
        if (empty($prefix)) {
            return $table;
        }

        // Evita duplicar prefijos
        if (str_starts_with($table, $prefix . '_')) {
            return $table;
        }

        // Devuelve el nombre con el prefijo
        return $prefix . '_' . $table;
    }
}
