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
        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_shift_id')->constrained()->onDelete('cascade');
            $table->foreignId('pasillera_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('type', ['transfer', 'payment', 'giro', 'pasillera_payment']);
            $table->decimal('amount', 15, 2);
            $table->string('client')->nullable();
            $table->string('machine')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_transactions');
    }
};
