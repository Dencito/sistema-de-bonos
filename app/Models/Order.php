<?php

namespace App\Models;

use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, CompanyScope;

    protected $table = 'orders';

    protected $casts = [
        'products' => 'array',
    ];

    protected $fillable = [
        'products',
        'quantity',
        'payment_method',
        'paid_amount',
        'change',
        'total',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
