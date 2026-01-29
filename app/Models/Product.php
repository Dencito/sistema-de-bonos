<?php

namespace App\Models;

use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, CompanyScope;

    protected $table = 'products';

    protected $fillable = [
        'name',
        'code',
        'price',
        'quantity',
        'branch_id',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
