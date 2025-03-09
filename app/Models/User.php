<?php

namespace App\Models;

use App\Traits\CompanyScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, CompanyScope;


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
        'entry_date',
        'has_fingerprint',
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
        'role_id', 
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'birth_date' => 'date',
        'entry_date' => 'date',
        'has_fingerprint' => 'boolean',
        'password' => 'hashed',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($user) {
            if (!$user->entry_date) {
                $user->entry_date = now();
            }
        });
    }

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
        return $this->hasMany(Bonus::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function branches()
    {
        $prefix = config('company.prefix'); // Obtén el prefijo
        $pivotTable = $prefix ? $prefix . '_user_branches' : 'user_branches'; // Tabla pivote con prefijo
    
        return $this->belongsToMany(Branch::class, $pivotTable, 'user_id', 'branch_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
    
    /**
     * Get all tickets for the user.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}