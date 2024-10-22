<?php

namespace App\Http\Controllers\Bonuses;

use App\Http\Controllers\Controller;
use App\Models\Bonus;
use App\Models\UserBonus;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BonusController extends Controller
{
    public function index(Request $request)
    {
        // Obtener todas las categorías de bonos y pasarlas a la vista de Inertia
        $bonuses = Bonus::with(['users', 'categories'])->get();
        $data = [
            'bonuses' => $bonuses,
            'total' => $categoryBonuses->count()
        ];
        return Inertia::render('Bonus/Index', $data);
    }

    public function create(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'amount' => 'required|string',
            'type' => 'required|string',
            'start_datetime' => 'nullable',
            'end_datetime' => 'nullable',
        ]);

        // Verificar si la categoría ya existe
        $found = Bonus::where('name', $request->name)->first();

        if ($found) {
            return response()->json([
                'message' => 'El bono ya existe',
                'status' => 400
            ], 400);
        }
        $bonus = Bonus::create($request->all());

        return response()->json([
            'error' => false,
            'message' => 'Bono creado exitosamente',
        ]);
    }

    public function update(Request $request)
    {
        
        if (!auth()->user()->hasAnyRole(1)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        // Validar los datos del formulario
        $request->validate([
            'name' => 'required|string|max:255',
            'base_amount' => 'required|numeric',
            'additional_amount' => 'nullable|numeric',
        ]);

        $categoryBonus = Bonus::find($request->id);

        if (!$categoryBonus) {
            return response()->json(['message' => 'La categoria no existe', 'error' => true], 400);
        }

        // Actualizar la categoría de bonos
        $categoryBonus->update($request->all());
        return response()->json([
            'message' => 'La categoria ha sido actualizada exitosamente',
            'error' => false
        ], 200);
    }

    public function destroy(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        $categoryBonus = Bonus::find($request->id);

        if (!$categoryBonus) {
            return response()->json(['message' => 'La categoria no existe', 'error' => true], 400);
        }

        $categoryBonus->delete();

        return response()->json([
            'error' => false,
            'message' => 'La categoria ha sido eliminada exitosamente',
        ]);
    }

    public function assignMultipleUsers(Request $request)
    {
        // Validar los datos de la solicitud
        $validated = $request->validate([
            'bonus_id' => 'required|exists:bonuses,id',
            'users' => 'required|array',
            'users.*' => 'exists:users,id',
        ]);
    
        $bonusId = $validated['bonus_id'];
        $userIds = $validated['users'];
    
        // Comenzar una transacción para asegurar atomicidad
        DB::beginTransaction();
    
        try {
            // Iterar sobre los IDs de los usuarios para insertarlos en la tabla `user_bonuses`
            foreach ($userIds as $userId) {
                // Verificar si la relación ya existe para evitar duplicados
                $existingUserBonus = UserBonus::where('user_id', $userId)
                                                ->where('bonus_id', $bonusId)
                                                ->first();
    
                if (!$existingUserBonus) {
                    // Crear una nueva relación en `user_bonuses`
                    UserBonus::create([
                        'user_id' => $userId,
                        'bonus_id' => $bonusId,
                    ]);
                }
            }
    
            // Confirmar la transacción
            DB::commit();
    
            return response()->json([
                'error' => false,
                'message' => 'Usuarios asignados correctamente al bono',
            ]);
        } catch (\Exception $e) {
            // Revertir los cambios si ocurre un error
            DB::rollBack();
            return response()->json(['error' => true, 'message' => 'Error al asignar usuarios', 'details' => $e->getMessage()], 500);
        }
    }

    public function destroyMultipleUsers(Request $request)
    {
        // Validar los datos de la solicitud
        $validated = $request->validate([
            'bonus_id' => 'required|exists:bonuses,id',
            'users' => 'required|array',
            'users.*' => 'exists:users,id',
        ]);
    
        $bonusId = $validated['bonus_id'];
        $userIds = $validated['users'];
    
        // Comenzar una transacción para asegurar atomicidad
        DB::beginTransaction();
    
        try {
            // Iterar sobre los IDs de los usuarios para insertarlos en la tabla `user_bonuses`
            foreach ($userIds as $userId) {
                // Verificar si la relación ya existe para evitar duplicados
                $existingUserBonus = UserBonus::where('user_id', $userId)
                                                ->where('bonus_id', $bonusId)
                                                ->delete();
    
                if (!$existingUserBonus) {
                    // Crear una nueva relación en `user_bonuses`
                    UserBonus::create([
                        'user_id' => $userId,
                        'bonus_id' => $bonusId,
                    ]);
                }
            }
    
            // Confirmar la transacción
            DB::commit();
    
            return response()->json([
                'error' => false,
                'message' => 'Se han eliminado los bonos correctamente.',
            ]);
        } catch (\Exception $e) {
            // Revertir los cambios si ocurre un error
            DB::rollBack();
            return response()->json(['error' => true, 'message' => 'Error al asignar usuarios', 'details' => $e->getMessage()], 500);
        }
    }



    public function applyBonus(User $user)
    {
        // Obtener todos los bonos disponibles
        $bonuses = Bonus::all();

        $bonusesApplied = [];

        foreach ($bonuses as $bonus) {
            // Si el bono es de cumpleaños y hoy es el cumpleaños del usuario
            if ($bonus->type == 'birthday' && $this->isUserBirthday($user)) {
                $this->assignBonus($user, $bonus);
                $bonusesApplied[] = $bonus->name;
            }

            // Si el bono es para la fecha de hoy
            if ($bonus->type == 'today' && $this->isToday($bonus)) {
                $this->assignBonus($user, $bonus);
                $bonusesApplied[] = $bonus->name;
            }
        }

        // Responder con los bonos aplicados
        return response()->json([
            'message' => 'Bonos aplicados correctamente',
            'bonuses' => $bonusesApplied
        ]);
    }

    // Verificar si es el cumpleaños del usuario
    private function isUserBirthday(User $user)
    {
        // Asume que 'birthday' es una fecha en el modelo User
        return $user->birthday && Carbon::parse($user->birthday)->isToday();
    }

    // Verificar si el bono es aplicable hoy
    private function isToday(Bonus $bonus)
    {
        $today = Carbon::now()->format('Y-m-d');
        return Carbon::parse($bonus->start_datetime)->format('Y-m-d') == $today;
    }

    // Asignar el bono al usuario
    private function assignBonus(User $user, Bonus $bonus)
    {
        // Asocia el bono al usuario en la tabla de `user_bonuses`
        $user->bonuses()->attach($bonus->id);
    }
}
