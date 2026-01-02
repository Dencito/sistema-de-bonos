<?php

use App\Http\Controllers\Branches\BranchController;
use App\Http\Controllers\Companies\CompanyController;
use App\Http\Controllers\Shifts\ShiftRecordController;
use App\Http\Controllers\Tickets\TicketController;
use App\Http\Controllers\Totems\TotemController;
use App\Http\Controllers\Users\UserController;
use App\Http\Controllers\FingerprintLogs\FingerprintLogController;
use App\Http\Controllers\Reports\ReportsController;
use App\Http\Controllers\Reports\ReportController;
use App\Http\Controllers\Mobile\MobileAuthController;
use App\Http\Controllers\Mobile\MobilePasilleraController;
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
    
    Route::get('/reports/fingerprint-logs', [ReportsController::class, 'getFingerprintLogsReport']);
    
    Route::get('/reports/players', [ReportController::class, 'playersReport']);
    
    Route::get('/reports/shift/{id}', [ReportController::class, 'shiftReport']);
    
    Route::get('/filter-by-bonus', [UserController::class, 'filterUsersByBonus']);
});

Route::post('/totems/associate-with-branch', [TotemController::class, 'associateWithBranch']);

Route::patch('/shifts/{shift}/close', [ShiftRecordController::class, 'close']);

Route::get('/branches', [BranchController::class, 'getBranches']);

Route::apiResource('tickets', TicketController::class);

Route::apiResource('totems', TotemController::class);

Route::apiResource('shifts', ShiftRecordController::class);

// Direct report routes
Route::get('/reports/players', [ReportController::class, 'playersReport']);
Route::get('/reports/shift/{id}', [ReportController::class, 'shiftReport']);
Route::get('/reports/fingerprint-logs', [ReportsController::class, 'getFingerprintLogsReport']);

// Mobile API Routes
// Public routes (no authentication required)
Route::prefix('mobile')->group(function () {
    Route::post('/login', [MobileAuthController::class, 'login']);
});

// Protected mobile routes (require authentication)
Route::prefix('mobile')->middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [MobileAuthController::class, 'logout']);
    Route::get('/me', [MobileAuthController::class, 'me']);
    Route::post('/refresh', [MobileAuthController::class, 'refresh']);
    
    // Pasillera routes
    Route::prefix('pasillera')->group(function () {
        Route::get('/my-active', [MobilePasilleraController::class, 'getMyActivePasillera']);
        Route::post('/expense', [MobilePasilleraController::class, 'registerExpense']);
        Route::get('/history', [MobilePasilleraController::class, 'getExpenseHistory']);
        Route::get('/machines', [MobilePasilleraController::class, 'getMachines']);
        Route::get('/balance', [MobilePasilleraController::class, 'getBalance']);
        Route::post('/finalize-shift', [MobilePasilleraController::class, 'finalizeShift']);
    });
});
