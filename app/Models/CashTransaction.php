<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\CompanyScope;

class CashTransaction extends Model
{
    use HasFactory, CompanyScope;

    protected $fillable = [
        'cash_shift_id',
        'pasillera_id',
        'type',
        'expense_type',
        'amount',
        'client',
        'machine',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function cashShift()
    {
        return $this->belongsTo(CashShift::class);
    }

    public function pasillera()
    {
        return $this->belongsTo(Pasillera::class);
    }
}
