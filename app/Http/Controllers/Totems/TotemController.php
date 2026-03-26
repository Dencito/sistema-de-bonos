<?php

namespace App\Http\Controllers\Totems;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Totem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TotemController extends Controller
{
    public function index()
    {
        $totems = Totem::with(['branch'])->get();
        $branches = Branch::all();

        return Inertia::render('Totems/index', [
            'records' => $totems,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string',
            'branch_id' => 'required',
            'active' => 'nullable|boolean'
        ]);

        $code = Totem::where('code', $validated['code'])->first();
        if ($code) {
            return response()->json([
                'success' => false,
                'message' => 'Código de tótem ya existe'
            ], 409);
        }
        $branch = Branch::find($validated['branch_id']);

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'Sucursal no encontrada'
            ], 409);
        }

        return Totem::create($validated);
    }

    public function show(Totem $totem)
    {
        return $totem;
    }

    public function update(Request $request, Totem $totem)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|unique:totems,code,' . $totem->id,
            'branch_id' => 'sometimes|exists:branches,id',
            'active' => 'nullable|boolean'
        ]);

        $totem->update($validated);
        
        // Recargar el tótem con la relación branch para el frontend
        return $totem->load('branch');
    }

    public function destroy(Totem $totem)
    {
        $totem->delete();
        return response()->noContent();
    }

    public function associateWithBranch(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string',
                'branch_id' => 'required',
                'active' => 'nullable|boolean'
            ]);

            $branch = Branch::find($validated['branch_id']);
            if (!$branch) {
                return response()->json([
                    'message' => 'Sucursal no encontrada'
                ], 404);
            }

            // Buscar si el tótem ya existe por código
            $totem = Totem::where('code', $validated['code'])->first();
            
            if ($totem) {
                // Si el tótem existe y tiene la misma sucursal, retornar el existente
                if ($totem->branch_id == $validated['branch_id']) {
                    return response()->json([
                        'message' => 'El tótem ya está asociado a esta sucursal',
                        'totem' => $totem
                    ], 200);
                }
                
                // Si el tótem existe pero con diferente sucursal, actualizar la sucursal
                $totem->update([
                    'name' => $validated['name'],
                    'branch_id' => $validated['branch_id'],
                    'active' => $validated['active'] ?? $totem->active
                ]);
                
                return response()->json([
                    'message' => 'Tótem cambiado de sucursal exitosamente',
                    'totem' => $totem
                ], 200);
            }

            // Si el tótem no existe, crear uno nuevo
            $totem = Totem::create($validated);
            
            return response()->json([
                'message' => 'Tótem creado y asociado correctamente',
                'totem' => $totem
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al asociar el tótem: ' . $e->getMessage()
            ], 500);
        }
    }
}
