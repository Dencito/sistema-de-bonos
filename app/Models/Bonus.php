<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bonus extends Model
{
    use HasFactory;

    protected $fillable = [
        'amount',
        'start_datetime',
        'end_datetime',
        'user_id'
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
}
