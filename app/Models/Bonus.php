<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\CompanyScope;

class Bonus extends Model
{
    use HasFactory, CompanyScope;

    protected $fillable = [
        'amount',
        'start_datetime',
        'end_datetime',
        'user_id',
        'active'
    ];
    
    protected $casts = [
        'active' => 'boolean',
        'start_datetime' => 'datetime',
        'end_datetime' => 'datetime',
        'amount' => 'decimal:2'
    ];

    // Relación con el modelo User (un bono pertenece a un usuario)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function categories()
    {
        return $this->belongsToMany(CategoryBonus::class, 'category_bonuses_bonuses', 'bonus_id', 'category_id');
    }
    
    /**
     * Scope a query to only include active bonuses.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
