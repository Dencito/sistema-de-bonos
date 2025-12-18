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
        Schema::table('pasilleras', function (Blueprint $table) {
            // Add user_id column if it doesn't exist
            if (!Schema::hasColumn('pasilleras', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('cash_shift_id')->constrained()->onDelete('cascade');
            }
            
            // Drop name column if it exists and we're using user_id instead
            if (Schema::hasColumn('pasilleras', 'name')) {
                $table->dropColumn('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pasilleras', function (Blueprint $table) {
            if (Schema::hasColumn('pasilleras', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            }
            
            if (!Schema::hasColumn('pasilleras', 'name')) {
                $table->string('name')->after('cash_shift_id');
            }
        });
    }
};
