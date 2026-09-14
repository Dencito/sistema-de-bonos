<?php

namespace App\Models;

use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Model;

/**
 * Un movimiento sobre una cuenta.
 *
 * El signo del monto manda: positivo entra plata, negativo sale. En la planilla
 * el campo "Asunto" decia "carga" en 1.088 filas de las cuales 213 eran
 * negativas, asi que la etiqueta no servia para distinguir nada.
 *
 * Un traspaso entre cuentas son dos filas con el mismo transfer_group_id: una
 * negativa en la cuenta de origen y otra positiva en la de destino.
 */
class BankMovement extends Model
{
    use CompanyScope;

    const KIND_CARGA = 'carga';
    const KIND_RETIRO = 'retiro';
    const KIND_TRASPASO = 'traspaso';
    const KIND_AJUSTE = 'ajuste';

    const KINDS = [
        self::KIND_CARGA => 'Carga',
        self::KIND_RETIRO => 'Retiro',
        self::KIND_TRASPASO => 'Traspaso entre cuentas',
        self::KIND_AJUSTE => 'Ajuste',
    ];

    protected $fillable = [
        'date',
        'bank_account_id',
        'bank_client_id',
        'user_id',
        'amount',
        'kind',
        'description',
        'transfer_group_id',
        'bank_import_id',
        'edit_history',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
        'edit_history' => 'array',
    ];

    public function account()
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }

    public function client()
    {
        return $this->belongsTo(BankClient::class, 'bank_client_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeCargas($query)
    {
        return $query->where('amount', '>', 0);
    }

    public function scopeRetiros($query)
    {
        return $query->where('amount', '<', 0);
    }

    public function getKindLabelAttribute(): string
    {
        return self::KINDS[$this->kind] ?? $this->kind;
    }
}
