<?php

namespace App\Constants;

class TransactionSource
{
    const CAJA = 'caja';
    const PASILLERA = 'pasillera';

    const ALL = [self::CAJA, self::PASILLERA];

    const LABELS = [
        self::CAJA => 'Caja',
        self::PASILLERA => 'Pasillera',
    ];
}
