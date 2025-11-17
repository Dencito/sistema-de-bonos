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
        'is_active',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'previous_balance' => 'decimal:2',
        'initial_balance' => 'decimal:2',
        'total_initial_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'total_transfers' => 'decimal:2',
        'total_giros' => 'decimal:2',
        'total_payments' => 'decimal:2',
        'is_active' => 'boolean',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
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
}
