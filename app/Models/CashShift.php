<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\CompanyScope;

class CashShift extends Model
{
    use HasFactory, CompanyScope;

    protected $fillable = [
        'user_id',
        'branch_id',
        'previous_balance',
        'initial_balance',
        'total_initial_balance',
        'current_balance',
        'total_transfers',
        'total_giros',
        'total_payments',
        'total_other',
        'total_sorteo',
        'total_bonus_especial',
        'total_prestamo',
        'total_deposit',
        'total_withdrawal',
        'is_active',
        'started_at',
        'ended_at',
        'opening_20000',
        'opening_10000',
        'opening_5000',
        'opening_2000',
        'opening_1000',
        'opening_coins',
        'opening_total_counted',
        'closing_20000',
        'closing_10000',
        'closing_5000',
        'closing_2000',
        'closing_1000',
        'closing_coins',
        'closing_total_counted',
        'difference',
        'closing_notes',
        'admin_initial_value',
        'admin_user_id',
        'admin_value_set_at',
    ];

    protected $casts = [
        'previous_balance' => 'decimal:2',
        'initial_balance' => 'decimal:2',
        'total_initial_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'total_transfers' => 'decimal:2',
        'total_giros' => 'decimal:2',
        'total_payments' => 'decimal:2',
        'total_other' => 'decimal:2',
        'total_sorteo' => 'decimal:2',
        'total_bonus_especial' => 'decimal:2',
        'total_prestamo' => 'decimal:2',
        'total_deposit' => 'decimal:2',
        'total_withdrawal' => 'decimal:2',
        'is_active' => 'boolean',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'opening_20000' => 'integer',
        'opening_10000' => 'integer',
        'opening_5000' => 'integer',
        'opening_2000' => 'integer',
        'opening_1000' => 'integer',
        'opening_coins' => 'decimal:2',
        'opening_total_counted' => 'decimal:2',
        'closing_20000' => 'integer',
        'closing_10000' => 'integer',
        'closing_5000' => 'integer',
        'closing_2000' => 'integer',
        'closing_1000' => 'integer',
        'closing_coins' => 'decimal:2',
        'closing_total_counted' => 'decimal:2',
        'difference' => 'decimal:2',
        'admin_initial_value' => 'decimal:2',
        'admin_value_set_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function transactions()
    {
        return $this->hasMany(CashTransaction::class);
    }

    public function pasilleras()
    {
        return $this->hasMany(Pasillera::class);
    }

    public function adminUser()
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
