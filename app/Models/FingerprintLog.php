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
        'branch_id',
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
        // Contar cuántos registros previos tiene este usuario en esta sucursal
        $position = FingerprintLog::where('user_id', $this->user_id)
            ->where('branch_id', $this->branch_id)
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
     * Get the branch that registered the fingerprint.
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
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
     * Scope a query to only include logs from a specific branch.
     */
    public function scopeFromBranch(Builder $query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
