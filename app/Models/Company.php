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
        'state_id'
    ];


    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }

}
