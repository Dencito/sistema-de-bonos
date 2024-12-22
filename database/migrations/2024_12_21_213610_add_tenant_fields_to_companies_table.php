<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTenantFieldsToCompaniesTable extends Migration
{
    public function up()
    {
        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'domain')) {
                $table->string('domain')->nullable();
            }
            if (!Schema::hasColumn('companies', 'slug')) {
                $table->string('slug')->unique();
            }
            if (!Schema::hasColumn('companies', 'schema_name')) {
                $table->string('schema_name')->unique();
            }
            if (!Schema::hasColumn('companies', 'settings')) {
                $table->json('settings')->nullable();
            }
            if (!Schema::hasColumn('companies', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            if (!Schema::hasColumn('companies', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable();
            }
            if (!Schema::hasColumn('companies', 'subscription_ends_at')) {
                $table->timestamp('subscription_ends_at')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'domain',
                'slug',
                'schema_name',
                'settings',
                'is_active',
                'trial_ends_at',
                'subscription_ends_at'
            ]);
        });
    }
}
