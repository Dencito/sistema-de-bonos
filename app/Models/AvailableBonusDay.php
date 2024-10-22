<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AvailableBonusDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'day'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function schedules()
    {
        return $this->hasMany(AvailableBonusSchedule::class);
    }
}

