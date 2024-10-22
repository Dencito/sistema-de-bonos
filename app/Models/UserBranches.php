<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBranches extends Model
{
    use HasFactory;

    protected $table = 'user_branches';

    protected $fillable = [
        'user_id',
        'branch_id',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_branches');
    }
}
