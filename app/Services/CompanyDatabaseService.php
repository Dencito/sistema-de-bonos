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
            $statusesTable = $request->slug . '_statuses';
            $companiesTable = $request->slug . '_companies';
            $rolesTable = $request->slug . '_roles';
            $usersTable = $request->slug . '_users';
            $bonusesTable = $request->slug . '_bonuses';
            $branchesTable = $request->slug . '_branches';
            $userBranchesTable = $request->slug . '_user_branches';
            $categoryBonusesTable = $request->slug . '_category_bonuses';
            $ticketsTable = $request->slug . '_tickets';
            $totemsTable = $request->slug . '_totems';
            $shiftsTable = $request->slug . '_shifts';
            $fingerprintLogsTable = $request->slug . '_fingerprint_logs';
            $productsTable = $request->slug . '_products';
            $ordersTable = $request->slug . '_orders';
            $cashShiftsTable = $request->slug . '_cash_shifts';
            $cashTransactionsTable = $request->slug . '_cash_transactions';
            $pasillerasTable = $request->slug . '_pasilleras';

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
                    'domain' => $request->slug . '.' . env('GODADDY_DOMAIN'),
                    'slug' => $request->slug,
                    'schema_name' => $request->slug,
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
                    $table->decimal('birthday_amount', 10, 2)->default(0.0);
                    $table->integer('ticketNumber')->default(0);
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
                    $table->date('entry_date')->nullable()->default(now());
                    $table->boolean('has_fingerprint')->default(false);
                    $table->json('fingerprints')->nullable();
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
                    $table->foreignId('branch_id')->nullable()->constrained($branchesTable)->onDelete('set null');
                    $table->foreignId('company_id')->nullable()->constrained($companiesTable)->onDelete('cascade');
                    $table->foreignId('category_bonus_id')->nullable()->constrained($categoryBonusesTable)->onDelete('cascade');
                    $table->enum('cargo', ['PASILLER@', 'CAJER@', 'GUARDIA', 'ANFITRION', 'RECAUDADOR', 'ASISTENTE', 'OTRO'])->nullable();
                    $table->json('levels')->nullable();
                    $table->timestamps();
                });

                // Insertar usuarios iniciales
                DB::beginTransaction();
                try {
                    DB::table($usersTable)->insert([
                        [
                            'first_name' => $request->slug,
                            'first_last_name' => 'System',
                            'email' => $request->email,
                            'username' => $request->slug,
                            'password' => Hash::make($request->slug . '.password'),
                            'status_id' => 1,
                            'role_id' => 1,
                            'created_at' => now(),
                            'updated_at' => now()
                        ],
                        [
                            'first_name' => $request->slug,
                            'first_last_name' => 'System',
                            'email' => 'superadmin.' . $request->email,
                            'username' => 'superadmin.' . $request->slug,
                            'password' => Hash::make($request->slug . '.password'),
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
                    $table->decimal('amount', 10, 2)->default(0);
                    $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                    $table->boolean('active')->default(true);
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

            // 9. Creat tabla de totems
            if (!Schema::hasTable($totemsTable)) {
                Schema::create($totemsTable, function ($table) use ($branchesTable) {
                    $table->id();
                    $table->string('name')->nullable();
                    $table->string('code')->unique();
                    $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                    $table->boolean('active')->default(true);
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable();
                });
            }

            // 10. Crear tabla de tickets (depende de usuarios y tomos)
            if (!Schema::hasTable($ticketsTable)) {
                Schema::create($ticketsTable, function ($table) use ($usersTable, $totemsTable, $ticketsTable) {
                    $table->id();
                    $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                    $table->foreignId('totem_id')->nullable()->constrained($totemsTable)->onDelete('set null');
                    $table->decimal('total_amount', 10, 2)->default(0);
                    $table->string('type');
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable();
                });
                
                DB::statement("ALTER TABLE `{$ticketsTable}` ADD UNIQUE KEY `{$ticketsTable}_user_type_date_unique` (`user_id`, `type`, (CAST(`created_at` AS DATE)))");
            }

            // 11. Crear tabla de turnos (depende de usuarios y sucursales)
            if (!Schema::hasTable($shiftsTable)) {
                Schema::create($shiftsTable, function ($table) use ($usersTable, $branchesTable) {
                    $table->id();
                    $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                    $table->foreignId('opened_by_user_id')->constrained($usersTable)->onDelete('cascade')->nullable();
                    $table->foreignId('closed_by_user_id')->nullable()->constrained($usersTable)->onDelete('cascade');
                    $table->timestamp('opening_time')->useCurrent()->nullable();
                    $table->timestamp('closing_time')->nullable()->nullable();
                    $table->enum('status', ['open', 'closed'])->default('open');
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable();
                });
            }

            // 12. Crear tabla de registros de huellas (depende de usuarios y totems)
            if (!Schema::hasTable($fingerprintLogsTable)) {
                Schema::create($fingerprintLogsTable, function ($table) use ($usersTable, $totemsTable) {
                    $table->id();
                    $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                    $table->foreignId('totem_id')->nullable()->constrained($totemsTable)->onDelete('set null');
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable();
                });
            }

            // 13. Crear tabla de productos (depende de sucursales)
            if (!Schema::hasTable($productsTable)) {
                Schema::create($productsTable, function ($table) use ($branchesTable) {
                    $table->id();
                    $table->string('name');
                    $table->string('code')->unique();
                    $table->decimal('price', 10, 2);
                    $table->integer('quantity')->default(0);
                    $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                    $table->timestamps();
                });
            }

            // 14. Crear tabla de ordenes (depende de usuarios y sucursales)
            if (!Schema::hasTable($ordersTable)) {
                Schema::create($ordersTable, function ($table) use ($usersTable, $branchesTable) {
                    $table->id();
                    $table->json('products');
                    $table->integer('quantity');
                    $table->string('payment_method');
                    $table->decimal('paid_amount', 10, 2)->nullable();
                    $table->decimal('change', 10, 2)->nullable();
                    $table->decimal('total', 10, 2);
                    $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                    $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                    $table->timestamps();
                });
            }

            // 15. Crear tabla de retiros de ventas (depende de usuarios y sucursales)
            if (!Schema::hasTable($salesWithdrawalsTable)) {
                Schema::create($salesWithdrawalsTable, function ($table) use ($usersTable, $branchesTable) {
                    $table->id();
                    $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                    $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                    $table->decimal('amount', 15, 2);
                    $table->text('description')->nullable();
                    $table->timestamps();
                });
            }

            // 15. Crear tabla de turnos de caja (depende de usuarios y sucursales)
            if (!Schema::hasTable($cashShiftsTable)) {
                Schema::create($cashShiftsTable, function ($table) use ($usersTable, $branchesTable) {
                    $table->id();
                    $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                    $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                    $table->decimal('previous_balance', 15, 2)->default(0);
                    $table->decimal('initial_balance', 15, 2);
                    $table->decimal('total_initial_balance', 15, 2);
                    $table->decimal('current_balance', 15, 2);
                    $table->decimal('total_transfers', 15, 2)->default(0);
                    $table->decimal('total_giros', 15, 2)->default(0);
                    $table->decimal('total_payments', 15, 2)->default(0);
                    $table->boolean('is_active')->default(true);
                    $table->timestamp('started_at');
                    $table->timestamp('ended_at')->nullable();
                    
                    // Conteo de apertura
                    $table->integer('opening_20000')->default(0);
                    $table->integer('opening_10000')->default(0);
                    $table->integer('opening_5000')->default(0);
                    $table->integer('opening_2000')->default(0);
                    $table->integer('opening_1000')->default(0);
                    $table->decimal('opening_coins', 15, 2)->default(0);
                    $table->decimal('opening_total_counted', 15, 2)->default(0);
                    
                    // Conteo de cierre
                    $table->integer('closing_20000')->default(0);
                    $table->integer('closing_10000')->default(0);
                    $table->integer('closing_5000')->default(0);
                    $table->integer('closing_2000')->default(0);
                    $table->integer('closing_1000')->default(0);
                    $table->decimal('closing_coins', 15, 2)->default(0);
                    $table->decimal('closing_total_counted', 15, 2)->default(0);
                    
                    // Diferencia y notas
                    $table->decimal('difference', 15, 2)->default(0);
                    $table->text('closing_notes')->nullable();
                    
                    // Valor inicial establecido por admin
                    $table->decimal('admin_initial_value', 15, 2)->nullable();
                    $table->foreignId('admin_user_id')->nullable()->constrained($usersTable)->onDelete('set null');
                    $table->timestamp('admin_value_set_at')->nullable();
                    
                    $table->timestamps();
                });
            }

            // 16. Crear tabla de pasilleras (depende de cash_shifts y users)
            if (!Schema::hasTable($pasillerasTable)) {
                Schema::create($pasillerasTable, function ($table) use ($cashShiftsTable, $usersTable) {
                $table->id();
                $table->foreignId('cash_shift_id')->constrained($cashShiftsTable)->onDelete('cascade');
                $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                $table->decimal('initial_balance', 15, 2);
                $table->decimal('total_payments', 15, 2)->default(0);
                $table->decimal('current_balance', 15, 2);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
            }

            // 17. Crear tabla de transacciones de caja (depende de cash_shifts y pasilleras)
            if (!Schema::hasTable($cashTransactionsTable)) {
                Schema::create($cashTransactionsTable, function ($table) use ($cashShiftsTable, $pasillerasTable) {
                    $table->id();
                    $table->foreignId('cash_shift_id')->constrained($cashShiftsTable)->onDelete('cascade');
                    $table->foreignId('pasillera_id')->nullable()->constrained($pasillerasTable)->onDelete('set null');
                    $table->enum('type', ['transfer', 'payment', 'giro', 'pasillera_payment', 'pasillera_return']);
                    $table->decimal('amount', 15, 2);
                    $table->string('client')->nullable();
                    $table->string('machine')->nullable();
                    $table->text('description')->nullable();
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
            "{$companyPrefix}_products",
            "{$companyPrefix}_orders",
            "{$companyPrefix}_cash_shifts",
            "{$companyPrefix}_cash_transactions",
            "{$companyPrefix}_pasilleras",
        ];
    }

    public function getCompanyPrefix(): ?string
    {
        return config('company.prefix');
    }
}
