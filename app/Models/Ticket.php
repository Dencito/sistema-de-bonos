<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\Branch;
use App\Traits\CompanyScope;

class Ticket extends Model
{
    use HasFactory, CompanyScope;
    
    protected $fillable = [
        'user_id',
        'branch_id',
        'type',
        'total_amount',
        'ticket_number',
    ];
    
    protected $casts = [
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    /**
     * Get the user that owns the ticket.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Get the branch that owns the ticket.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
    
    /**
     * Scope a query to only include tickets created today.
     */
    public function scopeCreatedToday($query)
    {
        return $query->whereDate('created_at', today());
    }
}
