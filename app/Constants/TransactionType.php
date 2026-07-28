<?php

namespace App\Constants;

class TransactionType
{
    const TRANSFER = 'transfer';
    const PAYMENT = 'payment';
    const GIRO = 'giro';
    const OTHER = 'other';
    const SORTEO = 'sorteo';
    const BONUS_ESPECIAL = 'bonus_especial';
    const PRESTAMO = 'prestamo';
    const DEPOSIT = 'deposit';
    const WITHDRAWAL = 'withdrawal';
    const PASILLERA_PAYMENT = 'pasillera_payment';
    const PASILLERA_RETURN = 'pasillera_return';

    const ALL = [
        self::TRANSFER,
        self::PAYMENT,
        self::GIRO,
        self::OTHER,
        self::SORTEO,
        self::BONUS_ESPECIAL,
        self::PRESTAMO,
        self::DEPOSIT,
        self::WITHDRAWAL,
        self::PASILLERA_PAYMENT,
        self::PASILLERA_RETURN,
    ];

    const USER_CREABLE = [
        self::TRANSFER,
        self::PAYMENT,
        self::GIRO,
        self::OTHER,
        self::SORTEO,
        self::BONUS_ESPECIAL,
        self::PRESTAMO,
        self::DEPOSIT,
        self::WITHDRAWAL,
    ];

    const SYSTEM_ONLY = [
        self::PASILLERA_PAYMENT,
        self::PASILLERA_RETURN,
    ];

    const TYPES_THAT_REDUCE_BALANCE = [
        self::TRANSFER,
        self::PAYMENT,
        self::GIRO,
        self::OTHER,
        self::SORTEO,
        self::BONUS_ESPECIAL,
        self::PRESTAMO,
        self::WITHDRAWAL,
    ];

    const LABELS = [
        self::TRANSFER => 'Transferencia',
        self::PAYMENT => 'Pago por Caja',
        self::GIRO => 'Giro',
        self::OTHER => 'Otro Gasto',
        self::SORTEO => 'Sorteo',
        self::BONUS_ESPECIAL => 'Bono Especial',
        self::PRESTAMO => 'Préstamo',
        self::DEPOSIT => 'Agregar Dinero',
        self::WITHDRAWAL => 'Quitar Dinero',
        self::PASILLERA_PAYMENT => 'Pago Pasillera',
        self::PASILLERA_RETURN => 'Reintegro Pasillera',
    ];

    const TOTAL_COLUMNS = [
        self::TRANSFER => 'total_transfers',
        self::GIRO => 'total_giros',
        self::PAYMENT => 'total_payments',
        self::OTHER => 'total_other',
        self::SORTEO => 'total_sorteo',
        self::BONUS_ESPECIAL => 'total_bonus_especial',
        self::PRESTAMO => 'total_prestamo',
        self::DEPOSIT => 'total_deposit',
        self::WITHDRAWAL => 'total_withdrawal',
    ];

    const PASILLERA_TOTAL_COLUMNS = [
        self::TRANSFER => 'total_transfers_pasillera',
        self::GIRO => 'total_giros_pasillera',
        self::PAYMENT => 'total_payments_pasillera',
        self::OTHER => 'total_other_pasillera',
        self::SORTEO => 'total_sorteo_pasillera',
        self::BONUS_ESPECIAL => 'total_bonus_especial_pasillera',
        self::PRESTAMO => 'total_prestamo_pasillera',
        self::DEPOSIT => 'total_deposit_pasillera',
        self::WITHDRAWAL => 'total_withdrawal_pasillera',
    ];
}
