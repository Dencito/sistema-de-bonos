<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

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
        'state_id',
        'company_id'
    ];

    public function shifts()
    {
        return $this->hasMany(Shift::class);
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
        return $this->hasMany(User::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }
}
