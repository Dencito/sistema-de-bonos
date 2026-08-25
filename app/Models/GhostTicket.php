<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\CompanyScope;

class GhostTicket extends Model
{
    use CompanyScope;

    protected $fillable = [
        'ticket_id',
        'branch_id',
        'cash_shift_id',
        'assigned_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function cashShift(): BelongsTo
    {
        return $this->belongsTo(CashShift::class);
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('cash_shift_id');
    }
}
