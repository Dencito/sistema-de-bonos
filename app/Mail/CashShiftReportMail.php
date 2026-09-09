<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Reporte completo de un turno de caja.
 *
 * No se encola: el prefijo de tablas de la empresa vive en la request, asi que
 * el reporte se arma y se manda en el mismo ciclo.
 */
class CashShiftReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $reporte;

    public function __construct(array $reporte)
    {
        $this->reporte = $reporte;
    }

    public function build()
    {
        $shift = $this->reporte['shift'];
        $estado = $shift->is_active ? 'Turno abierto' : 'Cierre de caja';

        $asunto = sprintf(
            '[%s] %s - %s - Turno #%d - %s',
            $this->reporte['empresa'],
            $estado,
            $this->reporte['sucursal'],
            $shift->id,
            optional($shift->started_at)->timezone(config('app.timezone'))->format('d/m/Y')
        );

        return $this->subject($asunto)
            ->view('emails.cash_shift_report')
            ->with(['r' => $this->reporte]);
    }
}
