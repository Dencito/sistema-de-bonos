<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;

class CompanyDatabaseService
{
    public function createCompanyTables(Request $request)
    {
        try {
            $statusesTable = $request->name . '_statuses';
            if (!Schema::hasTable($statusesTable)) {
                Schema::create($statusesTable, function ($table) {
                    $table->id();
                    $table->string('name');
                    $table->timestamps();
                });

                DB::table($statusesTable)->insert([
                    ['name' => 'Activo', 'created_at' => now(), 'updated_at' => now()],
                    ['name' => 'Inactivo', 'created_at' => now(), 'updated_at' => now()],
                    ['name' => 'En revisión', 'created_at' => now(), 'updated_at' => now()],
                    ['name' => 'Borrado', 'created_at' => now(), 'updated_at' => now()],
                ]);
            }

            $companiesTable = $request->name . '_companies';
            if (!Schema::hasTable($companiesTable)) {
                Schema::create($companiesTable, function ($table) {
                    $table->id();
                    $table->string('name');
                    $table->string('db_name')->nullable();
                    $table->foreignId('status_id')->constrained($statusesTable)->onDelete('cascade');
                    $table->timestamps();
                    $table->date('creationDate')->nullable();
                    $table->string('rutNumbers')->nullable();
                    $table->char('rutDv', 1)->nullable();
                    $table->string('business')->nullable();
                    $table->string('prefix')->nullable();
                    $table->string('phone')->nullable();
                    $table->string('email')->nullable();
                    $table->string('legalRepresentativeNames')->nullable();
                    $table->string('legalRepresentativeLastNames')->nullable();
                    $table->string('rutNumbersLegalRepresentative')->nullable();
                    $table->char('rutDvLegalRepresentative', 1)->nullable();
                    $table->string('contactNames')->nullable();
                    $table->string('contactLastNames')->nullable();
                    $table->string('rutNumbersContact')->nullable();
                    $table->char('rutDvContact', 1)->nullable();
                    $table->string('prefixContact')->nullable();
                    $table->string('contactPhone')->nullable();
                    $table->string('contactEmail')->nullable();
                    $table->string('companyAddressCountry')->nullable();
                    $table->string('companyAddressRegion')->nullable();
                    $table->string('companyAddressProvince')->nullable();
                    $table->string('companyAddressCommune')->nullable();
                    $table->string('companyAddressStreet')->nullable();
                    $table->string('companyAddressNumber')->nullable();
                    $table->integer('max_branches')->default(0);
                    $table->string('domain')->nullable();
                    $table->string('slug')->unique();
                    $table->string('schema_name')->unique();
                    $table->json('settings')->nullable();
                    $table->boolean('is_active')->default(true);
                    $table->timestamp('trial_ends_at')->nullable();
                    $table->timestamp('subscription_ends_at')->nullable();
                });

                DB::table($companiesTable)->insert([
                    'name' => $request->name,
                    'db_name' => 'db_' . $request->name,
                    'status_id' => 1,  // Activo
                    'created_at' => now(),
                    'updated_at' => now(),
                    'creationDate' => now(),
                    'business' => 'Default Business',
                    'prefix' => $request->prefix,
                    'phone' => '123456789',
                    'email' => $request->email,
                    'legalRepresentativeNames' => 'Legal Representative',
                    'legalRepresentativeLastNames' => 'Default',
                    'contactNames' => 'Contact',
                    'contactLastNames' => 'Person',
                    'contactEmail' => $request->contactEmail,
                    'companyAddressCountry' => 'Chile',
                    'companyAddressRegion' => 'Default Region',
                    'companyAddressProvince' => 'Default Province',
                    'companyAddressCommune' => 'Default Commune',
                    'companyAddressStreet' => 'Default Street',
                    'companyAddressNumber' => '123',
                    'max_branches' => 5,
                    'domain' => $request->name . '.' . env('APP_DOMAIN', 'localhost'),
                    'slug' => $request->name,
                    'schema_name' => $request->name,
                    'settings' => json_encode([]),
                    'is_active' => true,
                ]);
            }

            $rolesTable = $request->name . '_roles';
            if (!Schema::hasTable($rolesTable)) {
                Schema::create($rolesTable, function ($table) {
                    $table->id();
                    $table->string('name')->unique();
                    $table->string('description')->nullable();
                    $table->timestamps();
                });

                DB::beginTransaction();
                try {
                    $roles = ['duenio', 'super-admin', 'admin', 'supervisor', 'trabajador', 'jugador'];
                    foreach ($roles as $role) {
                        DB::table($rolesTable)->insert([
                            'name' => $role,
                            'description' => ucfirst($role),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }
            }

            $usersTable = $request->name . '_users';
            if (!Schema::hasTable($usersTable)) {
                Schema::create($usersTable, function ($table) use ($rolesTable) {
                    $table->id();
                    $table->string('first_name')->nullable();
                    $table->string('second_name')->nullable();
                    $table->string('first_last_name')->nullable();
                    $table->string('second_last_name')->nullable();
                    $table->string('phone')->unique()->nullable();
                    $table->date('birth_date')->nullable();
                    $table->string('email')->unique()->nullable();
                    $table->timestamp('email_verified_at')->nullable();
                    $table->string('nationality')->nullable();
                    $table->string('address')->nullable();
                    $table->string('marital_status')->nullable();
                    $table->string('pension')->nullable();
                    $table->string('health')->nullable();
                    $table->string('afp')->nullable();
                    $table->integer('childrens')->nullable();
                    $table->string('username')->unique()->nullable();
                    $table->string('password')->nullable();
                    $table->string('remember_token', 100)->nullable();
                    $table->bigInteger('status_id')->unsigned();
                    $table->bigInteger('branch_id')->unsigned()->nullable();
                    $table->bigInteger('company_id')->unsigned()->nullable();
                    $table->bigInteger('category_bonus_id')->unsigned()->nullable();
                    $table->string('prefix')->nullable();
                    $table->integer('rutNumbers')->nullable();
                    $table->string('rutDv')->nullable();
                    $table->integer('code')->nullable();
                    $table->unsignedBigInteger('role_id');
                    $table->timestamps();

                    $table
                        ->foreign('role_id')
                        ->references('id')
                        ->on($rolesTable)
                        ->onDelete('cascade')
                        ->onUpdate('cascade');
                });

                DB::beginTransaction();
                try {
                    DB::table($usersTable)->insert([
                        'first_name' => $request->name,
                        'first_last_name' => 'System',
                        'email' => $request->email,
                        'username' => $request->name,
                        'password' => Hash::make($request->name . '.password'),
                        'status_id' => 1,
                        'role_id' => 1,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }
            }

            $bonusesTable = $request->name . '_bonuses';
            if (!Schema::hasTable($bonusesTable)) {
                Schema::create($bonusesTable, function ($table) use ($usersTable) {
                    $table->id();
                    $table->decimal('amount', 10, 2);
                    $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                    $table->dateTime('start_datetime')->nullable();
                    $table->dateTime('end_datetime')->nullable();
                    $table->timestamps();
                });
            }

            $branchesTable = $request->name . '_branches';
            if (!Schema::hasTable($branchesTable)) {
                Schema::create($branchesTable, function ($table) {
                    $table->id();
                    $table->string('name');
                    $table->string('creationDate');
                    $table->string('numberOfEmployees');
                    $table->string('branchAddressCountry');
                    $table->string('branchAddressRegion');
                    $table->string('branchAddressProvince');
                    $table->string('branchAddressCommune');
                    $table->string('branchAddressStreet');
                    $table->string('branchAddressNumber');
                    $table->string('branchAddressLocal')->nullable();
                    $table->string('branchAddressDeptOrHouse')->nullable();
                    $table->json('available_schedules')->nullable();
                    $table->json('bonus_schedules')->nullable();
                    $table->foreignId('status_id')->constrained('statuses')->onDelete('cascade');
                    $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                    $table->timestamps();
                });
            }

            $userBranchesTable = $request->name . '_user_branches';
            if (!Schema::hasTable($userBranchesTable)) {
                Schema::create($userBranchesTable, function ($table) use ($usersTable, $branchesTable) {
                    $table->id();
                    $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                    $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                    $table->timestamps();
                });
            }

            return true;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    public function tableExists(string $companyPrefix, string $tableName): bool
    {
        return Schema::hasTable($companyPrefix . '_' . $tableName);
    }

    public function validateCompanyTables(string $companyPrefix): bool
    {
        foreach ($this->getRequiredTablesName($companyPrefix) as $table) {
            if (!$this->tableExists($companyPrefix, $table)) {
                return false;
            }
        }
        return true;
    }

    private function getRequiredTablesName(string $companyPrefix): array
    {
        if(env("APP_PRIMARY_SUBDOMAIN") === "tickets") {
            return [];
        }
        return [
            "{$companyPrefix}_roles",
            "{$companyPrefix}_users",
            "{$companyPrefix}_bonuses",
            "{$companyPrefix}_branches",
            "{$companyPrefix}_user_branches",
            "{$companyPrefix}_statuses",
            "{$companyPrefix}_companies",
        ];
    }


    public function getCompanyPrefix(): ?string
    {
        return config('company.prefix');
    }
}
