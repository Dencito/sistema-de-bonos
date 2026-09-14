<?php

namespace App\Constants;

use App\Models\User;

/**
 * Quien entra al modulo de bancos online.
 *
 * Dos caminos: por rol (supervisor para arriba) o por cargo. El cargo no es el
 * rol: un trabajador que por rol no entraria, entra si es CAJER@ o RECAUDADOR,
 * porque son los que abren y cierran el turno y cargan los movimientos.
 */
class BankAccess
{
    const CARGOS = ['CAJER@', 'RECAUDADOR'];

    public static function allows(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        if (RoleId::canManageBanks($user->role_id)) {
            return true;
        }

        return (bool) array_intersect(self::CARGOS, $user->cargo ?? []);
    }
}
