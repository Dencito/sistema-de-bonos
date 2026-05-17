<?php

namespace App\Models;

use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Model;

class Token extends Model
{
    use CompanyScope;

    protected $fillable = [
        'name',
        'token',
        'plain_text',
    ];

    protected $hidden = [
        'token',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
