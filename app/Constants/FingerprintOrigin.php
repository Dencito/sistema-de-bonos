<?php

namespace App\Constants;

/**
 * Por que se registro una huella.
 *
 * Es distinto del atributo `type` del modelo FingerprintLog, que dice Entrada o
 * Salida y se calcula por la posicion del registro. Esto dice que paso cuando el
 * jugador apoyo el dedo: si se le entregaron bonos, si no le correspondia
 * ninguno, o si la sucursal tiene los tickets apagados.
 *
 * Sin este dato, una huella sin ticket asociado es ambigua: no se sabe si el
 * jugador no tenia bonos, si la sucursal los tenia deshabilitados, o si fue una
 * marca de asistencia de un trabajador.
 */
class FingerprintOrigin
{
    /** Se entregaron bonos y se imprimieron tickets */
    const BONO = 'bono';

    /** El jugador marco pero no le correspondia ningun bono */
    const SIN_BONO = 'sin_bono';

    /** La sucursal tiene los tickets deshabilitados: solo se registro asistencia */
    const TICKETS_OFF = 'tickets_off';

    /** Marca directa de asistencia, sin pasar por la entrega de bonos */
    const ASISTENCIA = 'asistencia';

    const ALL = [
        self::BONO,
        self::SIN_BONO,
        self::TICKETS_OFF,
        self::ASISTENCIA,
    ];

    const LABELS = [
        self::BONO => 'Con bono',
        self::SIN_BONO => 'Sin bono',
        self::TICKETS_OFF => 'Tickets desactivados',
        self::ASISTENCIA => 'Asistencia',
    ];
}
