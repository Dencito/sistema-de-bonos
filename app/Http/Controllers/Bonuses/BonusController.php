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
        return Inertia::render('Bonus/index', $data);
    }

    public function create(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0|max:9999999.99',
            'start_datetime' => 'nullable|date',
            'end_datetime' => 'nullable|date|after:start_datetime',
            'user_id' => 'required'
        ], [
            'amount.max' => 'El monto no puede ser mayor a $9.999.999,99'
        ]);

        $bonus = Bonus::create([
            'amount' => $request->amount,
            'start_datetime' => $request->start_datetime,
            'end_datetime' => $request->end_datetime,
            'user_id' => $request->user_id
        ]);

        return response()->json([
            'error' => false,
            'message' => 'Bono creado exitosamente',
            'bonus' => $bonus
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

        $bonus = Bonus::find($request->id);

        if (!$bonus) {
            return response()->json(['message' => 'El bono no existe', 'error' => true], 400);
        }

        $bonus->delete();

        return response()->json([
            'error' => false,
            'message' => 'El bono ha sido eliminado exitosamente',
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
    
    /**
     * Crear bonos para múltiples usuarios a la vez
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createMultiple(Request $request)
    {
        // Validar los datos de la solicitud
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required',
            'amount' => 'required|numeric|min:0|max:9999999.99',
            'start_datetime' => 'nullable|date',
            'end_datetime' => 'nullable|date|after_or_equal:start_datetime',
        ]);
        
        $userIds = $validated['user_ids'];
        
        // Comenzar una transacción para asegurar atomicidad
        DB::beginTransaction();
        
        try {
            $createdBonuses = [];
            
            // Crear un bono para cada usuario
            foreach ($userIds as $userId) {
                $bonus = Bonus::create([
                    'amount' => $request->amount,
                    'start_datetime' => $request->start_datetime,
                    'end_datetime' => $request->end_datetime,
                    'user_id' => $userId,
                    'active' => true
                ]);
                
                $createdBonuses[] = $bonus;
            }
            
            // Confirmar la transacción
            DB::commit();
            
            return response()->json([
                'success' => true,
                'error' => false,
                'message' => 'Bonos creados exitosamente para ' . count($userIds) . ' usuarios',
                'bonuses' => $createdBonuses
            ]);
        } catch (\Exception $e) {
            // Revertir los cambios si ocurre un error
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => true, 
                'message' => 'Error al crear los bonos', 
                'details' => $e->getMessage()
            ], 500);
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

    /**
     * Crear bonos dobles para todos los jugadores de una sucursal
     * El monto será el doble del monto base de la categoría de bono de cada usuario
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createDoubleBonuses(Request $request)
    {
        // Validar los datos de la solicitud
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required',
            'start_datetime' => 'required|date',
            'end_datetime' => 'required|date|after_or_equal:start_datetime',
        ]);
        
        $userIds = $validated['user_ids'];
        
        // Buscar todos los jugadores (role_id = 6) seleccionados
        $players = User::where('role_id', 6)
            ->whereIn('id', $userIds)
            ->with('categoryBonus')
            ->get();
        
        if ($players->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontraron jugadores válidos en la selección',
            ], 404);
        }
        
        // Comenzar una transacción para asegurar atomicidad
        DB::beginTransaction();
        
        try {
            $createdBonuses = [];
            $playersWithoutCategory = [];
            
            // Crear un bono doble para cada jugador
            foreach ($players as $player) {
                // Verificar que el jugador tenga una categoría de bono
                if (!$player->categoryBonus || !$player->categoryBonus->base_amount) {
                    $playersWithoutCategory[] = $player->username;
                    continue;
                }
                
                // Calcular el monto doble basado en la categoría del jugador
                $doubleAmount = $player->categoryBonus->base_amount * 2;
                
                // Crear el bono
                $bonus = Bonus::create([
                    'amount' => $doubleAmount,
                    'start_datetime' => $request->start_datetime,
                    'end_datetime' => $request->end_datetime,
                    'user_id' => $player->id,
                    'active' => true
                ]);
                
                $createdBonuses[] = $bonus;
            }
            
            // Confirmar la transacción
            DB::commit();
            
            $message = 'Bonos dobles creados exitosamente para ' . count($createdBonuses) . ' jugadores';
            
            if (!empty($playersWithoutCategory)) {
                $message .= '. ' . count($playersWithoutCategory) . ' jugadores no tienen categoría de bono asignada';
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'count' => count($createdBonuses),
                'bonuses' => $createdBonuses,
                'players_without_category' => $playersWithoutCategory
            ]);
        } catch (\Exception $e) {
            // Revertir los cambios si ocurre un error
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear los bonos dobles', 
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
