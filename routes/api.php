<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Companies\CompanyController;
use App\Mail\BranchCreatedMail;
use Illuminate\Support\Facades\Mail;
use App\Models\Company;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware(['auth', 'web'])->group(function () {
    Route::get('/companies/verify', [CompanyController::class, 'verifyCompany']);

});

Route::middleware('web')->post('/companies/select', [CompanyController::class, 'selectCompany']);
Route::middleware('web')->post('/companies/deselect', [CompanyController::class, 'deselectCompany']);


Route::get('/test-mail', function (Request $request) {
    Mail::to(env('MAIL_TO_SEND'))
            ->send(new BranchCreatedMail('asd', Company::first()->name, 'user-pruebas'));

    return response()->json(['message' => 'Correo enviado exitosamente'], 200);


});


