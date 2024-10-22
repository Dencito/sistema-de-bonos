<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'shift_id',
        'start',
        'end',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
