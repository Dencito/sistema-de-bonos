<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\CompanyScope;
use App\Constants\TransactionType;
use App\Constants\TransactionSource;

class CashTransaction extends Model
{
    use HasFactory, CompanyScope;

    protected $fillable = [
        'cash_shift_id',
        'pasillera_id',
        'type',
        'source',
        'expense_type',
        'amount',
        'client',
        'machine',
        'description',
        'edit_history',
        'image',
        'admin_user_id',
    ];

    protected $casts = [
        'edit_history' => 'array',
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

    public function adminUser()
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function isFromPasillera(): bool
    {
        return $this->source === TransactionSource::PASILLERA;
    }

    public function getSourceLabel(): string
    {
        return TransactionSource::LABELS[$this->source] ?? $this->source;
    }

    public function getTypeLabel(): string
    {
        return TransactionType::LABELS[$this->type] ?? $this->type;
    }
}
