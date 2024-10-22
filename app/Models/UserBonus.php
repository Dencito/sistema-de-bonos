<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBonus extends Model
{
    use HasFactory;

    protected $table = 'user_bonuses';

    protected $fillable = [
        'user_id',
        'bonus_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bonus()
    {
        return $this->belongsTo(Bonus::class);
    }
}
