<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\State;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('states', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });
        
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('db_name')->nullable();
            $table->foreignId('state_id')->constrained('states')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('branches', function (Blueprint $table) {
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
            $table->foreignId('state_id')->constrained('states')->onDelete('cascade');
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('second_name')->nullable();
            $table->string('first_last_name')->nullable();
            $table->string('second_last_name')->nullable();
            $table->string('phone')->nullable();
            $table->integer('rut')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('email')->unique()->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('nationality')->nullable();
            $table->string('address')->nullable();
            $table->string('marital_status')->nullable();
            $table->string('pension')->nullable();
            $table->string('health')->nullable();
            $table->string('afp')->nullable();
            $table->integer('children')->nullable();
            $table->date('company_entry_date')->nullable();
            $table->string('username')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->foreignId('state_id')->constrained('states')->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        State::create(['name' => 'Activo']);
        State::create(['name' => 'Inactivo']);
        State::create(['name' => 'En revisión']);
        State::create(['name' => 'Borrado']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('companies');
        Schema::dropIfExists('states');
    }
};