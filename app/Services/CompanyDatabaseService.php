<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class CompanyDatabaseService
{
    protected $requiredTables = ['roles', 'users'];

    public function createCompanyTables(string $companyPrefix)
    {
        try {
            DB::beginTransaction();

            // Crear tabla de roles
            $rolesTable = $companyPrefix . '_roles';
            if (!Schema::hasTable($rolesTable)) {
                Schema::create($rolesTable, function ($table) {
                    $table->id();
                    $table->string('name')->unique();
                    $table->string('description')->nullable();
                    $table->timestamps();
                });

                // Insertar roles por defecto
                $roles = ['duenio', 'super-admin', 'admin', 'supervisor', 'trabajador', 'jugador'];
                foreach ($roles as $role) {
                    DB::table($rolesTable)->insert([
                        'name' => $role,
                        'description' => ucfirst($role),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            // Crear tabla de usuarios
            $usersTable = $companyPrefix . '_users';
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

                    // Relación con roles
                    $table
                        ->foreign('role_id')
                        ->references('id')
                        ->on($rolesTable)
                        ->onDelete('cascade')
                        ->onUpdate('cascade');
                });

                // Crear usuario admin por defecto
                DB::table($usersTable)->insert([
                    'first_name' => 'Admin',
                    'first_last_name' => 'System',
                    'email' => 'admin@' . $companyPrefix . '.com',
                    'username' => 'admin_' . $companyPrefix,
                    'password' => Hash::make('password'),
                    'status_id' => 1,  // Asegúrate de que este ID existe
                    'role_id' => 1,  // ID del rol 'duenio'
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function tableExists(string $companyPrefix, string $tableName): bool
    {
        return Schema::hasTable($companyPrefix . '_' . $tableName);
    }

    public function validateCompanyTables(string $companyPrefix): bool
    {
        foreach ($this->requiredTables as $table) {
            if (!$this->tableExists($companyPrefix, $table)) {
                return false;
            }
        }
        return true;
    }

    public function getCompanyPrefix(): ?string
    {
        return config('company.prefix');
    }
}
