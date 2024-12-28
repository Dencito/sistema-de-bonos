<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'second_name',
        'first_last_name',
        'second_last_name',
        'prefix',
        'phone',
        'rutNumbers',
        'rutDv',
        'code',
        'birth_date',
        'email',
        'nationality',
        'address',
        'marital_status',
        'pension',
        'health',
        'afp',
        'childrens',
        'username',
        'password',
        'branch_id',
        'status_id',
        'company_id',
        'category_bonus_id',
        'role_id', // Add this
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function hasRole($role): bool
    {
        if (is_string($role)) {
            return $this->role->name === $role;
        }
        return $this->role_id === $role->id;
    }

    public function hasAnyRole(...$roles): bool
    {
        $roles = collect($roles)
            ->flatten()
            ->map(function ($role) {
                if (is_numeric($role)) {
                    return $role;
                }
                if (is_string($role)) {
                    $foundRole = Role::where('name', $role)->first();
                    return $foundRole ? $foundRole->id : null;
                }
                return null;
            })
            ->filter()
            ->toArray();

        return in_array($this->role_id, $roles);
    }

    public function assignRole($role)
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->firstOrFail();
        }
        $this->role_id = $role->id;
        $this->save();
        return $this;
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function categoryBonus()
    {
        return $this->belongsTo(CategoryBonus::class);
    }

    public function bonuses()
    {
        return $this->belongsToMany(Bonus::class, 'user_bonuses');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'user_branches');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
