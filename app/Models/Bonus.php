<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bonus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'amount',
        'type',
        'start_datetime',
        'end_datetime',
    ];

    // Relación con el modelo User (un bono puede estar asignado a muchos usuarios)
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_bonuses');
    }
    
    public function categories()
    {
        return $this->belongsToMany(CategoryBonus::class, 'category_bonuses_bonuses', 'bonus_id', 'category_id');
    }
}
