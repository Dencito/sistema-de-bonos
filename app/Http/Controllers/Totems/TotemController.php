<?php

namespace App\Http\Controllers\Totems;

use App\Models\Totem;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class TotemController extends Controller
{
    public function index()
    {
        return Totem::with(['branch'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:totems',
            'branch_id' => 'required|exists:branches,id',
            'active' => 'nullable|boolean'
        ]);

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
