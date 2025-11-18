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
            // Add user_id column after cash_shift_id
            $table->foreignId('user_id')->after('cash_shift_id')->constrained()->onDelete('cascade');
            
            // Drop name column
            $table->dropColumn('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pasilleras', function (Blueprint $table) {
            // Re-add name column
            $table->string('name')->after('cash_shift_id');
            
            // Drop user_id column
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
