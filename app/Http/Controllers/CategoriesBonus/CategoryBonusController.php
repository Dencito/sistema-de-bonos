<?php

namespace App\Http\Controllers\CategoriesBonus;

use App\Http\Controllers\Controller;
use App\Models\CategoryBonus;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryBonusController extends Controller
{
    public function index(Request $request)
    {
        // Obtener todas las categorías de bonos y pasarlas a la vista de Inertia
        $categoryBonuses = CategoryBonus::with(['users', 'bonuses'])->get();
        $data = [
            'categoriesBonus' => $categoryBonuses,
            'total' => $categoryBonuses->count()
        ];
        return Inertia::render('CategoriesBonus/index', $data);
    }

    public function create(Request $request)
    {
        // Validar los datos del formulario
        $request->validate([
            'name' => 'required|string|max:255',
            'base_amount' => 'required',
            'additional_amount' => 'nullable',
        ]);

        // Verificar si la categoría ya existe
        $found = CategoryBonus::where('name', $request->name)->first();

        if ($found) {
            return response()->json([
                'message' => 'La categoría ya existe',
                'status' => 400
            ], 400);
        }

        // Crear la nueva categoría de bonos
        $category = CategoryBonus::create($request->all());

        return response()->json([
            'error' => false,
            'message' => 'Categoría creada exitosamente',
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

        $categoryBonus = CategoryBonus::find($request->id);

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
        $categoryBonus = CategoryBonus::find($request->id);

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
            'category_bonus_id' => 'required',
            'users' => 'required|array',
            'users.*' => 'exists:users,id',
        ]);

        $categoryBonusId = $validated['category_bonus_id'];
        $userIds = $validated['users'];

        // Comenzar una transacción para asegurar atomicidad
        DB::beginTransaction();

        try {
            foreach ($userIds as $userId) {
                $user = User::find($userId);
                
                if ($user) {
                    // Actualiza el category_bonus_id para cada usuario
                    $user->update([
                        'category_bonus_id' => $categoryBonusId
                    ]);
                }
            }

            // Confirmar la transacción
            Db::commit();

            return response()->json([
                'error' => false,
                'message' => 'Usuarios actualizados correctamente',
            ]);
        } catch (\Exception $e) {
            // Revertir los cambios si ocurre un error
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar los usuarios', 'details' => $e->getMessage()], 500);
        }
    }
}
