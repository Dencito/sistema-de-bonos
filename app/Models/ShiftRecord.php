<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Branch;
use App\Models\User;
use App\Traits\CompanyScope;

class ShiftRecord extends Model
{
    use HasFactory, CompanyScope;
    
    protected $table = 'shifts';
    
    protected $fillable = [
        'branch_id',
        'opened_by_user_id',
        'closed_by_user_id',
        'opening_time',
        'closing_time',
        'status'
    ];
    
    protected $casts = [
        'opening_time' => 'datetime',
        'closing_time' => 'datetime',
        'status' => 'string'
    ];
    
    /**
     * Get the branch that owns the shift.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
    
    /**
     * Get the user who opened the shift.
     */
    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_user_id');
    }
    
    /**
     * Get the user who closed the shift.
     */
    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_user_id');
    }
    
    /**
     * Scope a query to only include open shifts.
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }
    
    /**
     * Scope a query to only include shifts for a specific branch.
     */
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
