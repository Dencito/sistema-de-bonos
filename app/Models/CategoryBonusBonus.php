<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoryBonusBonus extends Model
{
    use HasFactory;

    protected $table = 'category_bonuses_bonuses';

    protected $fillable = [
        'category_id',
        'bonus_id',
    ];

    public function category()
    {
        return $this->belongsTo(CategoryBonus::class, 'category_id');
    }

    public function bonus()
    {
        return $this->belongsTo(Bonus::class, 'bonus_id');
    }
}
