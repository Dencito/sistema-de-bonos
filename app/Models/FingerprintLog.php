<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Traits\CompanyScope;

class FingerprintLog extends Model
{

    use CompanyScope;
    
    protected $fillable = [
        'user_id',
        'totem_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['type'];

    /**
     * Get the type attribute (Entrada/Salida) based on the position of the log.
     * Even position = Entrada, Odd position = Salida
     */
    public function getTypeAttribute()
    {
        // Contar cuántos registros previos tiene este usuario en este tótem
        $position = FingerprintLog::where('user_id', $this->user_id)
            ->where('totem_id', $this->totem_id)
            ->where('created_at', '<=', $this->created_at)
            ->count();
        
        // Si la posición es impar (1, 3, 5...), es Entrada
        // Si la posición es par (2, 4, 6...), es Salida
        return ($position % 2 === 1) ? 'Entrada' : 'Salida';
    }

    /**
     * Get the user that owns the fingerprint log.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Get the totem that registered the fingerprint.
     */
    public function totem()
    {
        return $this->belongsTo(Totem::class, 'totem_id', 'id');
    }

    /**
     * Scope a query to only include logs from a specific date.
     */
    public function scopeFromDate(Builder $query, string $date)
    {
        return $query->whereDate('created_at', $date);
    }

    /**
     * Scope a query to only include logs between dates.
     */
    public function scopeBetweenDates(Builder $query, string $startDate, string $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope a query to only include logs from a specific user.
     */
    public function scopeFromUser(Builder $query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to only include logs from a specific totem.
     */
    public function scopeFromTotem(Builder $query, int $totemId)
    {
        return $query->where('totem_id', $totemId);
    }
}
