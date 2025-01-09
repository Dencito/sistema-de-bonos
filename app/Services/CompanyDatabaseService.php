<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class CompanyDatabaseService
{
    public function createCompanyTables(Request $request)
    {
        try {
            $statusesTable = $request->name . '_statuses';
            $companiesTable = $request->name . '_companies';
            $rolesTable = $request->name . '_roles';
            $usersTable = $request->name . '_users';
            $bonusesTable = $request->name . '_bonuses';
            $branchesTable = $request->name . '_branches';
            $userBranchesTable = $request->name . '_user_branches';
            $categoryBonusesTable = $request->name . '_category_bonuses';

            // 1. Crear tabla de estados (no tiene dependencias)
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

            // 2. Crear tabla de empresas (depende de estados)
            if (!Schema::hasTable($companiesTable)) {
                Schema::create($companiesTable, function ($table) use ($statusesTable) {
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
                    'status_id' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                    'creationDate' => now(),
                    'business' => $request->business,
                    'prefix' => $request->prefix,
                    'phone' => $request->phone,
                    'email' => $request->email,
                    'rutNumbers' => $request->rutNumbers,
                    'rutDv' => $request->rutDv,
                    'legalRepresentativeNames' => $request->legalRepresentativeNames,
                    'legalRepresentativeLastNames' => $request->legalRepresentativeLastNames,
                    'rutNumbersLegalRepresentative' => $request->rutNumbersLegalRepresentative,
                    'rutDvLegalRepresentative' => $request->rutDvLegalRepresentative,
                    'contactNames' => $request->contactNames,
                    'contactLastNames' => $request->contactLastNames,
                    'contactEmail' => $request->contactEmail,
                    'contactPhone' => $request->contactPhone,
                    'prefixContact' => $request->prefixContact,
                    'rutNumbersContact' => $request->rutNumbersContact,
                    'rutDvContact' => $request->rutDvContact,
                    'companyAddressCountry' => $request->companyAddressCountry,
                    'companyAddressRegion' => $request->companyAddressRegion,
                    'companyAddressProvince' => $request->companyAddressProvince,
                    'companyAddressCommune' => $request->companyAddressCommune,
                    'companyAddressStreet' => $request->companyAddressStreet,
                    'companyAddressNumber' => $request->companyAddressNumber,
                    'max_branches' => $request->max_branches,
                    'domain' => $request->name . '.' . env('APP_DOMAIN', 'localhost'),
                    'slug' => $request->name,
                    'schema_name' => $request->name,
                    'settings' => json_encode([]),
                    'is_active' => true,
                ]);
            }

            // 3. Crear tabla de roles (no tiene dependencias)
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

            // 4. Crear tabla de sucursales (depende de estados y empresas)
            if (!Schema::hasTable($branchesTable)) {
                Schema::create($branchesTable, function ($table) use ($statusesTable, $companiesTable) {
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
                    $table->foreignId('status_id')->constrained($statusesTable)->onDelete('cascade');
                    $table->foreignId('company_id')->constrained($companiesTable)->onDelete('cascade');
                    $table->timestamps();
                });
            }

            // 5. Crear tabla de categorías de bonos (no tiene dependencias)
            if (!Schema::hasTable($categoryBonusesTable)) {
                Schema::create($categoryBonusesTable, function ($table) {
                    $table->id();
                    $table->string('name');
                    $table->integer('base_amount');
                    $table->timestamps();
                });
            }

            // 6. Crear tabla de usuarios (depende de roles, estados, empresas, sucursales y categorías de bonos)
            if (!Schema::hasTable($usersTable)) {
                Schema::create($usersTable, function ($table) use ($rolesTable, $statusesTable, $companiesTable, $branchesTable, $categoryBonusesTable) {
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
                    $table->string('prefix')->nullable();
                    $table->integer('rutNumbers')->nullable();
                    $table->string('rutDv')->nullable();
                    $table->integer('code')->nullable();
                    $table->foreignId('role_id')->constrained($rolesTable)->onDelete('cascade');
                    $table->foreignId('status_id')->constrained($statusesTable)->onDelete('cascade');
                    $table->foreignId('branch_id')->nullable()->constrained($branchesTable)->onDelete('cascade');
                    $table->foreignId('company_id')->nullable()->constrained($companiesTable)->onDelete('cascade');
                    $table->foreignId('category_bonus_id')->nullable()->constrained($categoryBonusesTable)->onDelete('cascade');
                    $table->timestamps();
                });

                // Insertar usuarios iniciales
                DB::beginTransaction();
                try {
                    DB::table($usersTable)->insert([
                        [
                            'first_name' => $request->name,
                            'first_last_name' => 'System',
                            'email' => $request->email,
                            'username' => $request->name,
                            'password' => Hash::make($request->name . '.password'),
                            'status_id' => 1,
                            'role_id' => 1,
                            'created_at' => now(),
                            'updated_at' => now()
                        ],
                        [
                            'first_name' => $request->name,
                            'first_last_name' => 'System',
                            'email' => 'superadmin.' . $request->email,
                            'username' => 'superadmin.' . $request->name,
                            'password' => Hash::make($request->name . '.password'),
                            'status_id' => 1,
                            'role_id' => 2,
                            'created_at' => now(),
                            'updated_at' => now()
                        ],
                    ]);
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }
            }

            // 7. Crear tabla de bonos (depende de usuarios)
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

            // 8. Crear tabla de relación usuarios-sucursales (depende de usuarios y sucursales)
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
            \Log::error('Error en createCompanyTables: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
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
        if (env('APP_PRIMARY_SUBDOMAIN') === 'tickets') {
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
