<?php

use App\Http\Controllers\Branches\BranchController;
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

Route::prefix('users')->group(function () {
    Route::get('/{id}/bonuses/{totemUUID}/totem', [UserController::class, 'getBonusesAvailablesUserById']);

    Route::post('/attendance', [UserController::class, 'markFingerprint']);

    Route::post('/totem/login', [UserController::class, 'ValidateLoginTotem']);

    Route::post('/enroll', [UserController::class, 'enroll']);

    Route::get('/fingerprints/{totemUUID}/totem', [UserController::class, 'getFingerprintsByRole']);
    
    Route::get('/fingerprint-logs/by-shift', [UserController::class, 'getFingerprintLogsByShift']);
    
    Route::get('/reports/workers', [UserController::class, 'getWorkersReport']);
});

Route::post('/totems/associate-with-branch', [TotemController::class, 'associateWithBranch']);

Route::patch('/shifts/{shift}/close', [ShiftRecordController::class, 'close']);

Route::get('/branches', [BranchController::class, 'getBranches']);

Route::apiResource('tickets', TicketController::class);

Route::apiResource('totems', TotemController::class);

Route::apiResource('shifts', ShiftRecordController::class);
