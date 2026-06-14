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
    ];

    protected $casts = [
        'initial_balance' => 'decimal:2',
        'total_payments' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
        'force_closed' => 'boolean',
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
}
