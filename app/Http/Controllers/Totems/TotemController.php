<?php

namespace App\Http\Controllers\Totems;

use App\Models\Totem;
use App\Models\Branch;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class TotemController extends Controller
{
    public function index()
    {
        $totems = Totem::with(['branch'])->get();
        $branches = Branch::all();
        
        return Inertia::render('Totems/index', [
            'totems' => $totems,
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
            'code' => 'sometimes|string|unique:totems,code,'.$totem->id,
            'branch_id' => 'sometimes|exists:branches,id',
            'active' => 'nullable|boolean'
        ]);

        $totem->update($validated);
        return $totem;
    }

    public function destroy(Totem $totem)
    {
        $totem->delete();
        return response()->noContent();
    }
}
