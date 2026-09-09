<?php

namespace App\Services;

use App\Constants\TransactionSource;
use App\Constants\TransactionType;
use App\Mail\CashShiftReportMail;
use App\Models\CashShift;
use App\Models\GhostTicket;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Arma y envia el reporte completo de un turno de caja.
 *
 * Se usa en tres momentos:
 *  - al cerrar la caja (automatico)
 *  - a pedido desde el panel de caja, con el turno todavia abierto ("como va")
 *  - a pedido desde el historial de cajas, sobre cualquier turno
 */
class CashShiftReportService
{
    /**
     * Destinatario del reporte. Es fijo a proposito: no se configura por UI.
     */
    public const REPORT_EMAIL = 'denarpadilla.lionel@gmail.com';

    /** Campos que la pasillera puede corregir, con su nombre para mostrar. */
    private const CAMPOS_EDITABLES = [
        'amount' => 'Monto',
        'client' => 'Cliente',
        'machine' => 'Máquina',
        'expense_type' => 'Tipo de gasto',
    ];

    /**
     * Arma el detalle completo del turno: saldos, conteo, totales por tipo,
     * movimientos (con sus correcciones), pasilleras y tickets.
     */
    public function build(CashShift $shift): array
    {
        $shift->loadMissing([
            'user:id,username,first_name,first_last_name',
            'branch:id,name',
            'adminUser:id,username,first_name,first_last_name',
            'transactions' => fn ($q) => $q->orderBy('created_at', 'asc'),
            'transactions.adminUser:id,username,first_name,first_last_name',
            'transactions.pasillera.user:id,username,first_name,first_last_name',
            'pasilleras.user:id,username,first_name,first_last_name',
            'pasilleras.transactions.pasillera.user:id,username,first_name,first_last_name',
            'pasilleras.transactions.adminUser:id,username,first_name,first_last_name',
        ]);

        $transactions = $shift->transactions;
        // Los movimientos de caja no guardan usuario propio: los registra quien
        // tiene el turno abierto, salvo que un admin haya autorizado la carga.
        $cajero = $this->nombreUsuario($shift->user);

        $movimientos = $transactions
            ->map(fn ($t) => $this->mapMovimiento($t, $cajero))
            ->values()
            ->all();

        return [
            'shift' => $shift,
            'empresa' => strtoupper((string) (config('company.prefix') ?: config('app.name'))),
            'sucursal' => $shift->branch->name ?? '-',
            'cajero' => $this->nombreUsuario($shift->user) ?? '-',
            'admin' => $this->nombreUsuario($shift->adminUser),
            'movimientos' => $movimientos,
            'cantidad_movimientos' => count($movimientos),
            'por_tipo' => $this->totalesPorTipo($shift, $transactions),
            'pasilleras' => $this->detallePasilleras($shift, $cajero),
            'tickets' => $this->tickets($shift),
            'generado_at' => now(),
        ];
    }

    /**
     * Manda el reporte. Nunca lanza: si el mail falla, se loguea y sigue,
     * porque el cierre de caja no puede depender del servidor de correo.
     */
    public function send(CashShift $shift, string $motivo, $solicitadoPor = null): bool
    {
        try {
            $data = $this->build($shift);
            $data['motivo'] = $motivo;
            $data['solicitado_por'] = $this->nombreUsuario($solicitadoPor);

            Mail::to(self::REPORT_EMAIL)->send(new CashShiftReportMail($data));

            return true;
        } catch (\Throwable $e) {
            Log::error('No se pudo enviar el reporte de caja', [
                'shift_id' => $shift->id,
                'motivo' => $motivo,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Totales por tipo separando lo que registro la caja de lo que registro la
     * pasillera: son los mismos numeros que muestra el panel.
     */
    private function totalesPorTipo(CashShift $shift, $transactions): array
    {
        $filas = [];

        foreach (TransactionType::TOTAL_COLUMNS as $type => $column) {
            // El pago de pasillera ya esta sumado dentro de total_payments.
            if ($type === TransactionType::PASILLERA_PAYMENT) {
                continue;
            }

            $columnaPasillera = TransactionType::PASILLERA_TOTAL_COLUMNS[$type] ?? null;
            $total = (float) ($shift->{$column} ?? 0);
            $pasillera = $columnaPasillera ? (float) ($shift->{$columnaPasillera} ?? 0) : 0.0;

            if ($total == 0.0 && $pasillera == 0.0) {
                continue;
            }

            $filas[] = [
                'tipo' => TransactionType::LABELS[$type] ?? $type,
                'caja' => $total - $pasillera,
                'pasillera' => $pasillera,
                'total' => $total,
                'cantidad' => $transactions->where('type', $type)->count(),
            ];
        }

        return $filas;
    }

    /**
     * Cada pasillera con sus numeros y el detalle de lo que registro.
     * Esos movimientos tambien salen en la lista general del turno: aca van
     * agrupados para poder revisar a una pasillera sin filtrar a mano.
     */
    private function detallePasilleras(CashShift $shift, ?string $cajero): array
    {
        return $shift->pasilleras->map(function ($p) use ($cajero) {
            $movimientos = $p->transactions
                ->sortBy('created_at')
                ->map(fn ($t) => $this->mapMovimiento($t, $cajero))
                ->values();

            // Cuanto rindio de lo que se le entrego: saldo asignado - saldo actual
            $rendido = (float) $p->initial_balance - (float) $p->current_balance;

            return [
                'id' => $p->id,
                'nombre' => $this->nombreUsuario($p->user) ?? ('Pasillera #' . $p->id),
                'initial_balance' => (float) $p->initial_balance,
                'total_payments' => (float) $p->total_payments,
                'current_balance' => (float) $p->current_balance,
                'rendido' => $rendido,
                'is_active' => (bool) $p->is_active,
                'force_closed' => (bool) $p->force_closed,
                'cantidad_movimientos' => $movimientos->count(),
                'total_movimientos' => (float) $movimientos->sum('amount'),
                'movimientos' => $movimientos->all(),
                'por_tipo' => $movimientos
                    ->groupBy('tipo')
                    ->map(fn ($items, $tipo) => [
                        'tipo' => $tipo,
                        'cantidad' => $items->count(),
                        'total' => (float) $items->sum('amount'),
                    ])
                    ->values()
                    ->all(),
                'ediciones' => $movimientos->sum(fn ($m) => count($m['ediciones'])),
            ];
        })->values()->all();
    }

    /**
     * Tickets del turno: los que se emitieron entre la apertura y el cierre, mas
     * los fantasmas que se le asignaron a mano.
     *
     * Un ticket fantasma es uno que quedo sin turno (se emitio con la caja
     * cerrada) y despues se asigno desde el panel: su created_at cae fuera de la
     * ventana, asi que buscarlo solo por fecha lo deja afuera del reporte aunque
     * su plata si haya salido de esta caja.
     */
    private function tickets(CashShift $shift): array
    {
        $asignados = GhostTicket::where('cash_shift_id', $shift->id)
            ->where('branch_id', $shift->branch_id)
            ->pluck('assigned_at', 'ticket_id');

        $tickets = Ticket::with('user:id,username,first_name,first_last_name')
            ->where('branch_id', $shift->branch_id)
            ->where(function ($q) use ($shift, $asignados) {
                $q->whereBetween('created_at', [$shift->started_at, $shift->ended_at ?? now()]);

                if ($asignados->isNotEmpty()) {
                    $q->orWhereIn('id', $asignados->keys());
                }
            })
            ->orderBy('created_at')
            ->get();

        $lista = $tickets->map(function ($t) use ($asignados) {
            $esFantasma = $asignados->has($t->id);

            return [
                'id' => $t->id,
                'created_at' => $t->created_at,
                'type' => $t->type,
                'amount' => (float) $t->total_amount,
                'jugador' => $this->nombreUsuario($t->user),
                'es_fantasma' => $esFantasma,
                'asignado_at' => $esFantasma ? $asignados->get($t->id) : null,
            ];
        });

        $fantasmas = $lista->where('es_fantasma', true);
        $normales = $lista->where('es_fantasma', false);

        // Fantasmas que siguen sin turno en esta sucursal: si quedan al cerrar,
        // esa plata no esta descontada de ninguna caja todavia.
        $pendientes = GhostTicket::with('ticket:id,total_amount')
            ->where('branch_id', $shift->branch_id)
            ->whereNull('cash_shift_id')
            ->get();

        return [
            'lista' => $lista->all(),
            'cantidad' => $lista->count(),
            'total' => (float) $lista->sum('amount'),
            'normales' => [
                'cantidad' => $normales->count(),
                'total' => (float) $normales->sum('amount'),
            ],
            'fantasmas' => [
                'cantidad' => $fantasmas->count(),
                'total' => (float) $fantasmas->sum('amount'),
            ],
            'pendientes' => [
                'cantidad' => $pendientes->count(),
                'total' => (float) $pendientes->sum(fn ($g) => (float) ($g->ticket->total_amount ?? 0)),
            ],
        ];
    }

    /**
     * Una transaccion de caja lista para mostrar. Se usa igual en la lista
     * general del turno y en el detalle de cada pasillera.
     */
    private function mapMovimiento($t, ?string $cajero): array
    {
        return [
            'id' => $t->id,
            'created_at' => $t->created_at,
            'tipo' => TransactionType::LABELS[$t->type] ?? $t->type,
            'origen' => TransactionSource::LABELS[$t->source]
                ?? TransactionSource::LABELS[TransactionSource::CAJA],
            'amount' => (float) $t->amount,
            'client' => $t->client,
            'machine' => $t->machine,
            'expense_type' => $t->expense_type,
            'description' => $t->description,
            'usuario' => $this->nombreUsuario($t->pasillera->user ?? null)
                ?? $this->nombreUsuario($t->adminUser)
                ?? $cajero,
            'ediciones' => $this->ediciones($t->edit_history),
        ];
    }

    private function nombreUsuario($user): ?string
    {
        if (!$user) {
            return null;
        }

        $nombre = trim(($user->first_name ?? '') . ' ' . ($user->first_last_name ?? ''));

        return $nombre !== '' ? $nombre : ($user->username ?? null);
    }

    /**
     * Aplana edit_history al mismo texto que muestran las pantallas.
     * Formato de cada entrada: { at, user, changes: { campo: { from, to } } }
     */
    private function ediciones($history): array
    {
        if (empty($history) || !is_array($history)) {
            return [];
        }

        $lista = [];

        foreach ($history as $entrada) {
            $cambios = [];

            foreach (($entrada['changes'] ?? []) as $campo => $valores) {
                $etiqueta = self::CAMPOS_EDITABLES[$campo] ?? $campo;
                $cambios[] = $etiqueta . ': '
                    . $this->valorEditado($campo, $valores['from'] ?? null)
                    . ' -> '
                    . $this->valorEditado($campo, $valores['to'] ?? null);
            }

            if (!$cambios) {
                continue;
            }

            $lista[] = [
                'at' => $entrada['at'] ?? null,
                'user' => $entrada['user'] ?? null,
                'cambios' => $cambios,
            ];
        }

        return $lista;
    }

    private function valorEditado(string $campo, $valor): string
    {
        if ($valor === null || $valor === '') {
            return '(vacío)';
        }

        return $campo === 'amount'
            ? '$' . number_format((float) $valor, 0, ',', '.')
            : (string) $valor;
    }
}
