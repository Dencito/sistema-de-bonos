<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColumnsToCompaniesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->date('creationDate')->nullable();
            $table->string('rutNumbers')->nullable();
            $table->char('rutDv', 1)->nullable();
            $table->string('business')->nullable();
            $table->string('prefix')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('legalRepresentativeNames')->nullable();
            $table->string('legalRepresentativeLastNames')->nullable();
            $table->string('rutNumbersLegalRepresentative')->nullable();
            $table->char('rutDvLegalRepresentative', 1)->nullable();
            $table->string('contactNames')->nullable();
            $table->string('contactLastNames')->nullable();
            $table->string('rutNumbersContact')->nullable();
            $table->char('rutDvContact', 1)->nullable();
            $table->string('prefixContact')->nullable();
            $table->string('contactPhone')->nullable();
            $table->string('contactEmail')->nullable();
            $table->string('companyAddressCountry')->nullable();
            $table->string('companyAddressRegion')->nullable();
            $table->string('companyAddressProvince')->nullable();
            $table->string('companyAddressCommune')->nullable();
            $table->string('companyAddressStreet')->nullable();
            $table->string('companyAddressNumber')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'creationDate',
                'rutNumbers',
                'rutDv',
                'business',
                'prefix',
                'phone',
                'email',
                'legalRepresentativeNames',
                'legalRepresentativeLastNames',
                'rutNumbersLegalRepresentative',
                'rutDvLegalRepresentative',
                'contactNames',
                'contactLastNames',
                'rutNumbersContact',
                'rutDvContact',
                'prefixContact',
                'contactPhone',
                'contactEmail',
                'companyAddressCountry',
                'companyAddressRegion',
                'companyAddressProvince',
                'companyAddressCommune',
                'companyAddressStreet',
                'companyAddressNumber',
            ]);
        });
    }
}
