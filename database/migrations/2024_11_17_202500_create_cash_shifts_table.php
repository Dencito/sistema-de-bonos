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
        Schema::create('cash_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
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
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_shifts');
    }
};
