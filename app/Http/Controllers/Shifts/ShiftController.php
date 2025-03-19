<?php

namespace App\Http\Controllers\Shifts;

use App\Http\Controllers\Controller;
use App\Models\ShiftRecord;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ShiftController extends Controller
{
    /**
     * Get the current shift status for the user's branch
     */
    public function getShiftStatus()
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'message' => 'El usuario no tiene una sucursal asignada',
                'status' => 'error',
                'data' => null
            ], 400);
        }
        
        // Check if there's an open shift for this branch
        $openShift = ShiftRecord::forBranch($branch->id)
            ->open()
            ->with(['openedBy', 'branch'])
            ->first();
        
        return response()->json([
            'message' => 'Estado del turno obtenido correctamente',
            'status' => 'success',
            'data' => [
                'hasOpenShift' => $openShift ? true : false,
                'shift' => $openShift
            ]
        ]);
    }
    
    /**
     * Start a new shift
     */
    public function startShift(Request $request)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'message' => 'El usuario no tiene una sucursal asignada',
                'status' => 'error',
                'data' => null
            ], 400);
        }
        
        // Check if there's already an open shift for this branch
        $openShift = ShiftRecord::forBranch($branch->id)
            ->open()
            ->first();
        
        if ($openShift) {
            return response()->json([
                'message' => 'Ya existe un turno abierto para esta sucursal',
                'status' => 'error',
                'data' => null
            ], 400);
        }
        
        // Create a new shift
        $shift = ShiftRecord::create([
            'branch_id' => $branch->id,
            'opened_by_user_id' => $user->id,
            'opening_time' => now(),
            'status' => 'open'
        ]);
        
        return response()->json([
            'message' => 'Turno iniciado correctamente',
            'status' => 'success',
            'data' => [
                'shift' => $shift->load(['openedBy', 'branch'])
            ]
        ]);
    }
    
    /**
     * End the current shift
     */
    public function endShift(Request $request)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'message' => 'El usuario no tiene una sucursal asignada',
                'status' => 'error',
                'data' => null
            ], 400);
        }
        
        // Find the open shift for this branch
        $openShift = ShiftRecord::forBranch($branch->id)
            ->open()
            ->first();
        
        if (!$openShift) {
            return response()->json([
                'message' => 'No hay un turno abierto para esta sucursal',
                'status' => 'error',
                'data' => null
            ], 400);
        }
        
        // Close the shift
        $openShift->update([
            'closed_by_user_id' => $user->id,
            'closing_time' => now(),
            'status' => 'closed'
        ]);
        
        return response()->json([
            'message' => 'Turno finalizado correctamente',
            'status' => 'success',
            'data' => [
                'shift' => $openShift->load(['openedBy', 'closedBy', 'branch'])
            ]
        ]);
    }
    
    /**
     * Get all shifts for the user's branch
     */
    public function index()
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return Inertia::render('Shifts/index', [
                'shifts' => [],
                'error' => 'El usuario no tiene una sucursal asignada'
            ]);
        }
        
        $shifts = ShiftRecord::forBranch($branch->id)
            ->with(['openedBy', 'closedBy', 'branch'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        return Inertia::render('Shifts/index', [
            'shifts' => $shifts
        ]);
    }
}
