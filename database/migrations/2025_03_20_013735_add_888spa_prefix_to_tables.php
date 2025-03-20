<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Definir nombres de tablas con prefijo 888spa_
        $totemsTable = '888spa_totems';
        $ticketsTable = '888spa_tickets';
        $shiftsTable = '888spa_shifts';
        $fingerprintLogsTable = '888spa_fingerprint_logs';
        $branchesTable = '888spa_branches';
        $usersTable = '888spa_users';

        // 1. Crear tabla de totems 
        if (!Schema::hasTable($totemsTable)) {
            Schema::create($totemsTable, function (Blueprint $table) use ($branchesTable) {
                $table->id();
                $table->string('name')->nullable();
                $table->string('code')->unique();
                $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                $table->boolean('active')->default(true);
                $table->timestamp('created_at')->useCurrent();  
                $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable();
            });
        }

        // 2. Crear tabla de tickets (depende de usuarios y totems)
        if (!Schema::hasTable($ticketsTable)) {
            Schema::create($ticketsTable, function (Blueprint $table) use ($usersTable, $totemsTable) {
                $table->id();
                $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                $table->foreignId('totem_id')->constrained($totemsTable)->onDelete('cascade');
                $table->decimal('total_amount', 10, 2)->default(0);
                $table->string('type');
                $table->timestamp('created_at')->useCurrent();  
                $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable();
            });
        }

        // 3. Crear tabla de turnos (depende de usuarios y sucursales)
        if (!Schema::hasTable($shiftsTable)) {
            Schema::create($shiftsTable, function (Blueprint $table) use ($usersTable, $branchesTable) {
                $table->id();
                $table->foreignId('branch_id')->constrained($branchesTable)->onDelete('cascade');
                $table->foreignId('opened_by_user_id')->constrained($usersTable)->onDelete('cascade')->nullable();
                $table->foreignId('closed_by_user_id')->constrained($usersTable)->onDelete('cascade')->nullable();
                $table->timestamp('opening_time')->useCurrent()->nullable();
                $table->timestamp('closing_time')->nullable();
                $table->enum('status', ['open', 'closed'])->default('open');
                $table->timestamp('created_at')->useCurrent();  
                $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable();
            });
        }

        // 4. Crear tabla de registros de huellas (depende de usuarios y totems)
        if (!Schema::hasTable($fingerprintLogsTable)) {
            Schema::create($fingerprintLogsTable, function (Blueprint $table) use ($usersTable, $totemsTable) {
                $table->id();
                $table->foreignId('user_id')->constrained($usersTable)->onDelete('cascade');
                $table->foreignId('totem_id')->constrained($totemsTable)->onDelete('cascade');
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrentOnUpdate()->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar tablas en orden inverso para evitar problemas con las claves foráneas
        Schema::dropIfExists('888spa_fingerprint_logs');
        Schema::dropIfExists('888spa_shifts');
        Schema::dropIfExists('888spa_tickets');
        Schema::dropIfExists('888spa_totems');
    }
};
