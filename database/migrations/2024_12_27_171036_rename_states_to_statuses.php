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
        Schema::rename('states', 'statuses');

        // Update foreign key references
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('state_id', 'status_id');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->renameColumn('state_id', 'status_id');
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->renameColumn('state_id', 'status_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('statuses', 'states');

        // Revert foreign key references
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('status_id', 'state_id');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->renameColumn('status_id', 'state_id');
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->renameColumn('status_id', 'state_id');
        });
    }
};
