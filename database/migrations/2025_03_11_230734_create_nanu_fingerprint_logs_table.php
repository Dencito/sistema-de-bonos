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
        if (!Schema::hasTable('nanu_fingerprint_logs')) {
            Schema::create('nanu_fingerprint_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('nanu_users')->onDelete('cascade');
                $table->foreignId('totem_id')->constrained('nanu_totems')->onDelete('cascade');
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
        Schema::dropIfExists('nanu_fingerprint_logs');
    }
};
