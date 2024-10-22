<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Companies\CompanyController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware(['auth', 'web'])->group(function () {
    Route::get('/companies/verify', [CompanyController::class, 'verifyCompany']);

});

Route::middleware('web')->post('/companies/select', [CompanyController::class, 'selectCompany']);
Route::middleware('web')->post('/companies/deselect', [CompanyController::class, 'deselectCompany']);

