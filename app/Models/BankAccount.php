<?php

namespace App\Models;

use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Model;

/**
 * Cuenta bancaria de la empresa (Friendly, BCI, Menta Limon, Efectivo...).
 *
 * No lleva branch_id: las cuentas son de la operacion entera, como en la
 * planilla que reemplaza este modulo.
 */
class BankAccount extends Model
{
    use CompanyScope;

    protected $fillable = [
        'name',
        'slug',
        'initial_balance',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'initial_balance' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function movements()
    {
        return $this->hasMany(BankMovement::class);
    }

    /**
     * Saldo actual = saldo inicial + todo lo que se movio.
     * Se calcula, nunca se guarda: asi no puede quedar una celda desfasada
     * como pasaba en la planilla.
     */
    public function currentBalance(): float
    {
        return (float) $this->initial_balance + (float) $this->movements()->sum('amount');
    }
}
