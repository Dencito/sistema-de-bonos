<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use HasFactory, CompanyScope;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'creationDate',
        'id',
        'name',
        'numberOfEmployees',
        'branchAddressCountry',
        'branchAddressRegion',
        'branchAddressProvince',
        'branchAddressCommune',
        'branchAddressStreet',
        'branchAddressNumber',
        'branchAddressLocal',
        'branchAddressDeptOrHouse',
        'company_id',
        'status_id',
        'available_schedules',
        'bonus_schedules',
        'birthday_amount',
        'sales_accumulator',
        'withdrawals',
        'ticketNumber',
        'bonus_attendance_enabled',
        'bonus_attendance_days',
        'bonus_category_payout_day'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birthday_amount' => 'decimal:2',
        'sales_accumulator' => 'decimal:2',
        'withdrawals' => 'array',
        'bonus_attendance_enabled' => 'boolean',
        'bonus_attendance_days' => 'array',
    ];

    public function shifts()
    {
        return $this->hasMany(ShiftRecord::class);
    }

    public function schedules()
    {
        return $this->hasManyThrough(ShiftSchedule::class, Shift::class);
    }

    public function availableBonusDays()
    {
        return $this->hasMany(AvailableBonusDay::class);
    }

    public function availableBonusDaysSchedules()
    {
        return $this->hasManyThrough(AvailableBonusSchedule::class, AvailableBonusDay::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, config('company.prefix') . '_user_branches', 'branch_id', 'user_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }
    
    /**
     * Get all totems for the branch.
     */
    public function totem()
    {
        return $this->hasOne(Totem::class);
    }
    
    /**
     * Get all shift records for the branch.
     */
    public function shiftRecords(): HasMany
    {
        return $this->hasMany(ShiftRecord::class);
    }
}
