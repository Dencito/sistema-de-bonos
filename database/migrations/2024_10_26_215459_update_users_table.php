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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('company_entry_date');

            $table->renameColumn('children', 'childrens');

            $table->string('rut')->nullable()->change();
            $table->string('username')->nullable()->change();
            $table->string('password')->nullable()->change();
            $table->string('phone')->unique()->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('company_entry_date')->nullable();

            $table->renameColumn('childrens', 'children');

            $table->string('username')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
            $table->integer('rut')->nullable()->change();
            $table->string('phone')->nullable()->change();
        });
    }
};
