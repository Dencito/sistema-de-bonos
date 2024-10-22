<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AvailableBonusSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'available_bonus_day_id',
        'start',
        'end',
    ];

    public function availableBonusDay()
    {
        return $this->belongsTo(AvailableBonusDay::class);
    }
}
