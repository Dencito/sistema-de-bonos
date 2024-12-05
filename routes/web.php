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

    Route::get('/total-amounts', function (Request $request) 
    {
        $user = auth()->user();

        $bonuses = $user->bonuses; 

        $categoryBonus = CategoryBonus::with('bonuses')->find($user->category_bonus_id);
        $data = [
            'bonuses' => $bonuses,
            'categoryBonus' => $categoryBonus,
        ];

        return Inertia::render('TotalAmounts/Index', $data);
    })->name('totalAmounts.index');


    //companies
    Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::post('/companies', [CompanyController::class, 'create'])->name('companies.create');
    Route::put('/companies', [CompanyController::class, 'update'])->name('companies.update');
    Route::delete('/companies/{id}', [CompanyController::class, 'destroy'])->name('companies.destroy');
    Route::post('/select-company', function (Request $request)
    {
        $request->validate([
            'company' => 'required',
        ]);

        // Guarda la empresa seleccionada en la sesión
        $request->session()->put('selected_company', $request->input('company'));

        return response()->json(['message' => 'Company selected successfully']);
    });
    Route::get('/selected-company', function (Request $request)
    {
        $company = $request->session()->get('selected_company');
        return response()->json(['company' => $company]);
    });

    Route::post('/clear-company', function () {
        session()->forget('selected_company');
        return response()->json(['message' => 'Company selection cleared.']);
    })->name('clear-company');
    //Route::post('/companies/change-db/{id}', [CompanyController::class, 'updateEnv'])->name('companies.updateEnv');

    //Branches
    Route::get('/branches', [BranchController::class, 'index'])->name('branches.index');
    Route::post('/branches', [BranchController::class, 'create'])->name('branches.create');
    Route::put('/branches', [BranchController::class, 'update'])->name('branches.update');
    Route::put('/branches/shifts', [BranchController::class, 'updateShifts'])->name('branches.updateShifts');
    Route::delete('/branches/shifts/{id}', [BranchController::class, 'deleteShift'])->name('branches.deleteShift');

    Route::put('/branches/shifts-available-bonus-days', [BranchController::class, 'updateShiftsAvailableBonusDays'])->name('branches.updateShiftsAvailableBonusDays');
    Route::delete('/branches/shifts-available-bonus-days/{id}', [BranchController::class, 'deleteShiftAvailableBonusDays'])->name('branches.deleteShiftAvailableBonusDays');
    
    //Shifts
    Route::put('/branches/shift-day', [BranchController::class, 'updateShiftDay'])->name('branches.updateShiftDay');
    Route::put('/branches/schedule', [BranchController::class, 'updateSchedule'])->name('branches.updateSchedule');
    Route::post('/branches/schedule/{shift_id}', [BranchController::class, 'addSchedule'])->name('branches.addSchedule');
    Route::delete('/branches/schedule/{id}', [BranchController::class, 'deleteSchedule'])->name('branches.deleteSchedule');
    Route::delete('/branches/{id}', [BranchController::class, 'destroy'])->name('branches.destroy');
    Route::post('/branches/request_more_branches', function(Request $request) {
        $company = Company::first();
        try {
            Mail::to(env('MAIL_TO_SEND'))
                ->send(new RequestMoreBranchesMail($company->name, $request->qty, auth()->user()->username));
                return response()->json(['message' => 'Se envio correctamente la solicitud.']);
        } catch (\Throwable $th) {
            abort(403, 'Error al enviar la solicitud');
        }
    })->name('branches.request_more_branches');
    
    //users
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    //roles
    Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
    Route::get('/states', [StateController::class, 'index'])->name('states.index');


    //categories bonus
    Route::get('/categories-bonus', [CategoryBonusController::class, 'index'])->name('categoriesBonus.index');
    Route::post('/categories-bonus', [CategoryBonusController::class, 'create'])->name('categoriesBonus.create');
    Route::put('/categories-bonus/{id}', [CategoryBonusController::class, 'update'])->name('categoriesBonus.create');
    Route::delete('/categories-bonus/{id}', [CategoryBonusController::class, 'destroy'])->name('categoriesBonus.create');
    Route::post('/categories-bonus/assign-multiple-users', [CategoryBonusController::class, 'assignMultipleUsers'])->name('assignMultipleUsers');
    

    //bonuses
    Route::post('/bonuses', [BonusController::class, 'create'])->name('bonus.create');
    Route::put('/bonuses/{id}', [BonusController::class, 'update'])->name('bonuses.update');
    Route::delete('/bonuses/{id}', [BonusController::class, 'destroy'])->name('bonuses.destroy');
    Route::post('/bonuses/assign-multiple-users', [BonusController::class, 'assignMultipleUsers'])->name('bonuses.assignMultipleUsers');
    Route::post('/bonuses/destroy-multiple-users', [BonusController::class, 'destroyMultipleUsers'])->name('bonuses.destroyMultipleUsers');

    //Remove later
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::post('/users/owner', [UserController::class, 'store'])->name('users.store');



require __DIR__.'/auth.php';
