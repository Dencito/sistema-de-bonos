<?php

use App\Http\Controllers\Companies\CompanyController;
use App\Http\Controllers\Shifts\ShiftRecordController;
use App\Http\Controllers\Tickets\TicketController;
use App\Http\Controllers\Totems\TotemController;
use App\Http\Controllers\Users\UserController;
use App\Mail\BranchCreatedMail;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

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

Route::get('/users/{id}/bonuses/{totemUUID}/totem', [UserController::class, 'getBonusesAvailablesUserById']);

Route::post('/users/attendance', [UserController::class, 'markFingerprint']);

Route::post('/users/totem/login', [UserController::class, 'ValidateLoginTotem']);

Route::post('/users/enroll', [UserController::class, 'enroll']);

Route::get('/users/fingerprints/{totemUUID}/totem', [UserController::class, 'getFingerprintsByRole']);

Route::apiResource('tickets', TicketController::class);

Route::apiResource('totems', TotemController::class);

Route::apiResource('shifts', ShiftRecordController::class);

Route::patch('/shifts/{shift}/close', [ShiftRecordController::class, 'close']);
