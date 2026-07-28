<?php

namespace App\Constants;

class RoleId
{
    const DUENIO = 1;
    const SUPER_ADMIN = 2;
    const ADMIN = 3;
    const SUPERVISOR = 4;
    const TRABAJADOR = 5;
    const JUGADOR = 6;

    /**
     * Roles que no tienen sucursal asignada y operan eligiendo una.
     */
    const BRANCH_SELECTORS = [
        self::DUENIO,
        self::SUPER_ADMIN,
        self::ADMIN,
    ];

    public static function canSelectBranch(?int $roleId): bool
    {
        return in_array($roleId, self::BRANCH_SELECTORS, true);
    }
}
