<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoryBonus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'base_amount',
    ];

    // Relación con el modelo User (un usuario puede tener una categoría de bono)
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function bonuses()
    {
        return $this->belongsToMany(Bonus::class, 'category_bonuses_bonuses', 'category_id', 'bonus_id');
    }
}
