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
