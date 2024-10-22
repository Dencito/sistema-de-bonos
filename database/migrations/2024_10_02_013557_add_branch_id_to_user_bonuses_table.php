<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('user_bonuses', function (Blueprint $table) {
            $table->string('branch_id')->constrained('branches')->nullable()->onDelete('cascade'); 
        });
    }

    public function down()
    {
        Schema::table('user_bonuses', function (Blueprint $table) {
            $table->dropColumn('branch_id');
        });
    }
};
