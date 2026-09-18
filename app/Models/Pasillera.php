<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\CompanyScope;

class Pasillera extends Model
{

    protected $table = 'pasilleras';
    use HasFactory, SoftDeletes, CompanyScope;

    protected $fillable = [
        'cash_shift_id',
        'user_id',
        'initial_balance',
        'total_payments',
        'current_balance',
        'is_active',
        'force_closed',
        // Cierre: lo que el sistema esperaba vs lo que entrego de verdad
        'expected_return',
        'returned_amount',
        'return_difference',
        'return_note',
        'closed_by',
        'closed_at',
        'return_history',
    ];

    protected $casts = [
        'initial_balance' => 'decimal:2',
        'total_payments' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
        'force_closed' => 'boolean',
        'expected_return' => 'decimal:2',
        'returned_amount' => 'decimal:2',
        'return_difference' => 'decimal:2',
        'closed_at' => 'datetime',
        'return_history' => 'array',
    ];

    protected $attributes = [
        'is_active' => true,
        'total_payments' => 0,
        'force_closed' => false,
    ];

    public function cashShift()
    {
        return $this->belongsTo(CashShift::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(CashTransaction::class);
    }

    public function closedBy()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }
}
