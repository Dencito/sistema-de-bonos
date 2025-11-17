<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\CompanyScope;

class Pasillera extends Model
{
    use HasFactory, CompanyScope;

    protected $fillable = [
        'cash_shift_id',
        'name',
        'initial_balance',
        'total_payments',
        'current_balance',
        'is_active',
    ];

    protected $casts = [
        'initial_balance' => 'decimal:2',
        'total_payments' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function cashShift()
    {
        return $this->belongsTo(CashShift::class);
    }

    public function transactions()
    {
        return $this->hasMany(CashTransaction::class);
    }
}
