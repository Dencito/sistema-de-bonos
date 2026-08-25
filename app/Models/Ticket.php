<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\Branch;
use App\Traits\CompanyScope;

class Ticket extends Model
{
    use HasFactory, CompanyScope;

    protected $fillable = [
        'user_id',
        'branch_id',
        'type',
        'total_amount',
        'ticket_number',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();

        // Al crear un ticket, reducir el saldo del turno activo
        static::created(function ($ticket) {
            $activeShift = CashShift::where('branch_id', $ticket->branch_id)
                ->where('is_active', true)
                ->first();

            if ($activeShift) {
                $activeShift->current_balance -= $ticket->total_amount;
                $activeShift->save();
            }
        });

        // Al actualizar un ticket, ajustar el saldo del turno activo
        static::updated(function ($ticket) {
            $activeShift = CashShift::where('branch_id', $ticket->branch_id)
                ->where('is_active', true)
                ->first();

            if ($activeShift && $ticket->isDirty('total_amount')) {
                $delta = $ticket->total_amount - $ticket->getOriginal('total_amount');
                $activeShift->current_balance -= $delta;
                $activeShift->save();
            }
        });

        // Al eliminar un ticket, devolver el monto al saldo del turno activo
        static::deleted(function ($ticket) {
            $activeShift = CashShift::where('branch_id', $ticket->branch_id)
                ->where('is_active', true)
                ->first();

            if ($activeShift) {
                $activeShift->current_balance += $ticket->total_amount;
                $activeShift->save();
            }
        });
    }

    /**
     * Get the user that owns the ticket.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the branch that owns the ticket.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the ghost ticket record associated with this ticket.
     */
    public function ghostTicket(): BelongsTo
    {
        return $this->belongsTo(GhostTicket::class);
    }

    /**
     * Scope a query to only include tickets created today.
     */
    public function scopeCreatedToday($query)
    {
        return $query->whereDate('created_at', today());
    }
}
