<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'second_name',
        'first_last_name',
        'second_last_name',
        'prefix',
        'phone',
        'rutNumbers',
        'rutDv',
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
        'state_id',
        'company_id',
        'category_bonus_id',
    ];

    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function categoryBonus()
    {
        return $this->belongsTo(CategoryBonus::class);
    }

    // Relación con Bonus a través de la tabla pivote user_bonuses (un usuario puede tener muchos bonos)
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
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
