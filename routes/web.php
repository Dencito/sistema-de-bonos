<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Companies\CompanyController;
use App\Http\Controllers\Branches\BranchController;
use App\Http\Controllers\Roles\RoleController;
use App\Http\Controllers\States\StateController;
use App\Http\Controllers\Users\UserController;
use App\Http\Controllers\CategoriesBonus\CategoryBonusController;
use App\Http\Controllers\Bonuses\BonusController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Company;
use App\Models\CategoryBonus;
use App\Mail\RequestMoreBranchesMail;
use Illuminate\Support\Facades\Mail;

Route::get('/', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    Route::get('/total-amounts', function (Request $request) {
        $user = auth()->user();
        $bonuses = $user->bonuses; 
        $categoryBonus = CategoryBonus::with('bonuses')->find($user->category_bonus_id);
        $data = [
            'bonuses' => $bonuses,
            'categoryBonus' => $categoryBonus,
        ];

        return Inertia::render('TotalAmounts/Index', $data);
    })->name('totalAmounts.index');

    Route::prefix('companies')->group(function() {
        Route::get('/', [CompanyController::class, 'index'])->name('companies.index');
        Route::post('/', [CompanyController::class, 'create'])->name('companies.create');
        Route::put('/', [CompanyController::class, 'update'])->name('companies.update');
        Route::delete('/{id}', [CompanyController::class, 'destroy'])->name('companies.destroy');
        
        Route::post('/select', function (Request $request) {
            $request->validate(['company' => 'required']);
            $request->session()->put('selected_company', $request->input('company'));
            return response()->json(['message' => 'Company selected successfully']);
        });
        
        Route::get('/selected', function (Request $request) {
            $company = $request->session()->get('selected_company');
            return response()->json(['company' => $company]);
        });
        
        Route::post('/clear', function () {
            session()->forget('selected_company');
            return response()->json(['message' => 'Company selection cleared.']);
        })->name('clear-company');
    });

    Route::prefix('branches')->group(function() {
        Route::get('/', [BranchController::class, 'index'])->name('branches.index');
        Route::post('/', [BranchController::class, 'create'])->name('branches.create');
        Route::put('/', [BranchController::class, 'update'])->name('branches.update');
        Route::delete('/{id}', [BranchController::class, 'destroy'])->name('branches.destroy');
        
        Route::put('/shifts', [BranchController::class, 'updateShifts'])->name('branches.updateShifts');
        Route::delete('/shifts/{id}', [BranchController::class, 'deleteShift'])->name('branches.deleteShift');
        Route::put('/shifts-available-bonus-days', [BranchController::class, 'updateShiftsAvailableBonusDays'])->name('branches.updateShiftsAvailableBonusDays');
        Route::delete('/shifts-available-bonus-days/{id}', [BranchController::class, 'deleteShiftAvailableBonusDays'])->name('branches.deleteShiftAvailableBonusDays');
        
        Route::put('/shift-day', [BranchController::class, 'updateShiftDay'])->name('branches.updateShiftDay');
        Route::put('/schedule', [BranchController::class, 'updateSchedule'])->name('branches.updateSchedule');
        Route::post('/schedule/{shift_id}', [BranchController::class, 'addSchedule'])->name('branches.addSchedule');
        Route::delete('/schedule/{id}', [BranchController::class, 'deleteSchedule'])->name('branches.deleteSchedule');
        
        Route::post('/request_more_branches', function(Request $request) {
            $company = Company::first();
            try {
                Mail::to(env('MAIL_TO_SEND'))
                    ->send(new RequestMoreBranchesMail($company->name, $request->qty, auth()->user()->username));
                return response()->json(['message' => 'Se envió correctamente la solicitud.']);
            } catch (\Throwable $th) {
                abort(403, 'Error al enviar la solicitud');
            }
        })->name('branches.request_more_branches');
    });

    Route::prefix('users')->group(function() {
        Route::get('/', [UserController::class, 'index'])->name('users.index');
        Route::post('/', [UserController::class, 'store'])->name('users.store');
        Route::put('/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
    
    Route::get('/states', [StateController::class, 'index'])->name('states.index');
    
    Route::prefix('categories-bonus')->group(function() {
        Route::get('/', [CategoryBonusController::class, 'index'])->name('categoriesBonus.index');
        Route::post('/', [CategoryBonusController::class, 'create'])->name('categoriesBonus.create');
        Route::put('/{id}', [CategoryBonusController::class, 'update'])->name('categoriesBonus.update');
        Route::delete('/{id}', [CategoryBonusController::class, 'destroy'])->name('categoriesBonus.destroy');
        Route::post('/assign-multiple-users', [CategoryBonusController::class, 'assignMultipleUsers'])->name('assignMultipleUsers');
    });
    
    Route::prefix('bonuses')->group(function() {
        Route::post('/', [BonusController::class, 'create'])->name('bonus.create');
        Route::put('/{id}', [BonusController::class, 'update'])->name('bonuses.update');
        Route::delete('/{id}', [BonusController::class, 'destroy'])->name('bonuses.destroy');
        Route::post('/assign-multiple-users', [BonusController::class, 'assignMultipleUsers'])->name('bonuses.assignMultipleUsers');
        Route::post('/destroy-multiple-users', [BonusController::class, 'destroyMultipleUsers'])->name('bonuses.destroyMultipleUsers');
    });

});

Route::post('/users/owner', [UserController::class, 'store'])->name('users.store');

require __DIR__.'/auth.php';
