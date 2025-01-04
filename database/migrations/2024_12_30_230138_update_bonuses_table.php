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
        Schema::table('bonuses', function (Blueprint $table) {
            // Drop existing columns if they exist
            if (Schema::hasColumn('bonuses', 'name')) {
                $table->dropColumn('name');
            }
            if (Schema::hasColumn('bonuses', 'type')) {
                $table->dropColumn('type');
            }
            
            // Modify existing columns if they exist
            if (Schema::hasColumn('bonuses', 'amount')) {
                $table->decimal('amount', 10, 2)->change();
            }
            
            // Add new columns
            if (!Schema::hasColumn('bonuses', 'user_id')) {
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            }
            if (!Schema::hasColumn('bonuses', 'start_datetime')) {
                $table->timestamp('start_datetime')->nullable();
            }
            if (!Schema::hasColumn('bonuses', 'end_datetime')) {
                $table->timestamp('end_datetime')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bonuses', function (Blueprint $table) {
            // Revert new columns
            if (Schema::hasColumn('bonuses', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            }
            if (Schema::hasColumn('bonuses', 'start_datetime')) {
                $table->dropColumn('start_datetime');
            }
            if (Schema::hasColumn('bonuses', 'end_datetime')) {
                $table->dropColumn('end_datetime');
            }
            
            // Restore original columns if they don't exist
            if (!Schema::hasColumn('bonuses', 'name')) {
                $table->string('name');
            }
            if (!Schema::hasColumn('bonuses', 'type')) {
                $table->string('type');
            }
            if (Schema::hasColumn('bonuses', 'amount')) {
                $table->string('amount')->change();
            }
        });
    }
};
