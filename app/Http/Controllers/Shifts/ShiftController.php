<?php

namespace App\Http\Controllers\Shifts;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\ShiftRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
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
            'closed_by_user_id' => null,  // Explicitly set to null since the shift is not closed yet
            'opening_time' => now(),
            'status' => 'open'
        ]);

        Cache::forever('one_shift_ticket_counter', 0);

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

        Cache::forever('one_shift_ticket_counter', 0);

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

        // Si el usuario es dueño, super-admin o admin, mostrar todos los turnos
        if (in_array($user->role->name, ['duenio', 'super-admin', 'admin'])) {
            $shifts = ShiftRecord::with(['openedBy:id,first_name,first_last_name,second_last_name',
                    'closedBy:id,first_name,first_last_name,second_last_name',
                    'branch:id,name'])
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // Para otros roles, solo mostrar los turnos de su sucursal
            $branch = $user->branch;

            if (!$branch) {
                return Inertia::render('Shifts/index', [
                    'shifts' => [],
                    'error' => 'El usuario no tiene una sucursal asignada'
                ]);
            }

            $shifts = ShiftRecord::forBranch($branch->id)
                ->with(['openedBy:id,first_name,first_last_name,second_last_name',
                    'closedBy:id,first_name,first_last_name,second_last_name',
                    'branch:id,name'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('Shifts/index', [
            'shifts' => $shifts
        ]);
    }
}
