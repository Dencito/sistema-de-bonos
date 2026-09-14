<?php

namespace App\Models;

use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Model;

/**
 * Cliente online. Tiene su propia ficha justamente para no repetir el problema
 * de la planilla, donde el mismo ID aparecia con cinco nombres distintos
 * ("claudia babello", "claudia cabello", "cludia cabello"...) y el mismo nombre
 * con dos IDs.
 *
 * Cuando se detecta que dos fichas son la misma persona, una queda apuntando a
 * la otra con merged_into_id en vez de borrarse: los movimientos viejos siguen
 * existiendo y se pueden reapuntar.
 */
class BankClient extends Model
{
    use CompanyScope;

    protected $fillable = [
        'external_id',
        'name',
        'normalized_name',
        'is_active',
        'notes',
        'merged_into_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function movements()
    {
        return $this->hasMany(BankMovement::class);
    }

    public function mergedInto()
    {
        return $this->belongsTo(BankClient::class, 'merged_into_id');
    }

    /**
     * Nombre comparable: sin tildes, sin puntuacion, sin dobles espacios.
     * Vive en BankStore para que valga igual con los datos en JSON o en la base.
     */
    public static function normalize(?string $name): string
    {
        return \App\Services\BankStore::normalizeName($name);
    }

    protected static function boot()
    {
        parent::boot();

        $sincronizar = function ($client) {
            $client->normalized_name = self::normalize($client->name);
        };

        static::creating($sincronizar);
        static::updating($sincronizar);
    }
}
