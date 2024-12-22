<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Company extends Model
{
    use HasFactory, HasRoles;

    protected $fillable = [
        'creationDate',
        'name',
        'rutNumbers',
        'rutDv',
        'business',
        'prefix',
        'phone',
        'email',
        'legalRepresentativeNames',
        'legalRepresentativeLastNames',
        'rutNumbersLegalRepresentative',
        'rutDvLegalRepresentative',
        'contactNames',
        'contactLastNames',
        'rutNumbersContact',
        'rutDvContact',
        'prefixContact',
        'contactPhone',
        'contactEmail',
        'companyAddressCountry',
        'companyAddressRegion',
        'companyAddressProvince',
        'companyAddressCommune',
        'companyAddressStreet',
        'companyAddressNumber',
        'max_branches',
        'db_name',
        'state_id',
        'domain',
        'slug',
        'schema_name',
        'settings',
        'is_active',
        'trial_ends_at',
        'subscription_ends_at'
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime'
    ];

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function userLogins()
    {
        return $this->hasMany(UserLogin::class);
    }

    public function userSessions()
    {
        return $this->hasMany(UserSession::class);
    }

    public function isActive()
    {
        return $this->is_active;
    }

    public function hasValidSubscription()
    {
        if ($this->trial_ends_at && $this->trial_ends_at->isFuture()) {
            return true;
        }

        return $this->subscription_ends_at && $this->subscription_ends_at->isFuture();
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }

}
