<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Branch;
use App\Models\Ticket;
use App\Traits\CompanyScope;

class Totem extends Model
{
    use HasFactory, CompanyScope;
    
    protected $fillable = [
        'name',
        'code',
        'active',
        'branch_id'
    ];
    
    /**
     * Get the branch that owns the totem.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
    
    /**
     * Get the tickets for the totem.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
