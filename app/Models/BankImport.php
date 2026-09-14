<?php

namespace App\Models;

use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Model;

/**
 * Cada vez que se sube una planilla queda registrado aca, y los movimientos que
 * entraron guardan el bank_import_id. Asi una importacion equivocada se puede
 * identificar y deshacer entera.
 */
class BankImport extends Model
{
    use CompanyScope;

    protected $fillable = [
        'filename',
        'rows_total',
        'rows_imported',
        'rows_skipped',
        'period_start',
        'period_end',
        'user_id',
        'notes',
    ];

    protected $casts = [
        'rows_total' => 'integer',
        'rows_imported' => 'integer',
        'rows_skipped' => 'integer',
        'period_start' => 'date',
        'period_end' => 'date',
    ];

    public function movements()
    {
        return $this->hasMany(BankMovement::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
