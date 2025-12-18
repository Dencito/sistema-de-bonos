<?php

namespace App\Http\Controllers\CashManagement;

use App\Http\Controllers\Controller;
use App\Models\CashShift;
use App\Models\CashTransaction;
use App\Models\Pasillera;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashManagementController extends Controller
{
    /**
     * Display the cash management page
     */
    public function index()
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return Inertia::render('SystemBank/Index', [
                'activeShift' => null,
                'previousBalance' => 0,
                'availableUsers' => [],
                'error' => 'No tienes una sucursal asignada'
            ]);
        }

        $branchId = $branch->id;

        // Get active shift if exists
        $activeShift = CashShift::with(['transactions', 'pasilleras.transactions', 'pasilleras.user'])
            ->where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        // Get previous shift balance
        $previousShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', false)
            ->orderBy('ended_at', 'desc')
            ->first();

        // Get available users for pasilleras (only users with cargo 'PASILLER@')
        $availableUsers = \App\Models\User::where('cargo', 'PASILLER@')
            ->where('status_id', 1) // Active users only
            ->where('branch_id', $branchId)
            ->select('id', 'first_name', 'first_last_name', 'second_name', 'second_last_name')
            ->get()
            ->map(function($u) {
                return [
                    'id' => $u->id,
                    'name' => trim($u->first_name . ' ' . ($u->second_name ?? '') . ' ' . $u->first_last_name . ' ' . ($u->second_last_name ?? ''))
                ];
            });

        return Inertia::render('SystemBank/Index', [
            'activeShift' => $activeShift,
            'previousBalance' => $previousShift ? $previousShift->current_balance : 0,
            'availableUsers' => $availableUsers,
        ]);
    }

    /**
     * Get current shift status
     */
    public function getShiftStatus()
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        $activeShift = CashShift::with(['transactions', 'pasilleras.transactions', 'pasilleras.user'])
            ->where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        $previousShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', false)
            ->orderBy('ended_at', 'desc')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'activeShift' => $activeShift,
                'previousBalance' => $previousShift ? $previousShift->current_balance : 0,
            ]
        ]);
    }

    /**
     * Start a new cash shift
     */
    public function startShift(Request $request)
    {
        $request->validate([
            'initial_balance' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        // Check if there's an active shift
        $activeShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if ($activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe un turno activo'
            ], 400);
        }

        // Get previous shift balance
        $previousShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', false)
            ->orderBy('ended_at', 'desc')
            ->first();

        $previousBalance = $previousShift ? $previousShift->current_balance : 0;
        $totalInitialBalance = $previousBalance + $request->initial_balance;

        $shift = CashShift::create([
            'user_id' => $user->id,
            'branch_id' => $branchId,
            'previous_balance' => $previousBalance,
            'initial_balance' => $request->initial_balance,
            'total_initial_balance' => $totalInitialBalance,
            'current_balance' => $totalInitialBalance,
            'started_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Turno iniciado correctamente',
            'data' => $shift
        ]);
    }

    /**
     * End current cash shift
     */
    public function endShift()
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        $activeShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        $activeShift->update([
            'is_active' => false,
            'ended_at' => now(),
        ]);

        // Deactivate all pasilleras
        Pasillera::where('cash_shift_id', $activeShift->id)
            ->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Turno cerrado correctamente',
            'data' => $activeShift
        ]);
    }

    /**
     * Add a transaction
     */
    public function addTransaction(Request $request)
    {
        $request->validate([
            'type' => 'required|in:transfer,payment,giro',
            'amount' => 'required|numeric|min:0',
            'client' => 'nullable|string',
            'machine' => 'nullable|string',
        ]);

        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        $activeShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        DB::beginTransaction();
        try {
            $description = $request->type . ' - ' . ($request->client ?: $request->machine ?: 'Sin detalle');

            $transaction = CashTransaction::create([
                'cash_shift_id' => $activeShift->id,
                'type' => $request->type,
                'amount' => $request->amount,
                'client' => $request->client,
                'machine' => $request->machine,
                'description' => $description,
            ]);

            // Update shift totals
            switch ($request->type) {
                case 'transfer':
                    $activeShift->total_transfers += $request->amount;
                    $activeShift->current_balance += $request->amount;
                    break;
                case 'giro':
                    $activeShift->total_giros += $request->amount;
                    $activeShift->current_balance -= $request->amount;
                    break;
                case 'payment':
                    $activeShift->total_payments += $request->amount;
                    $activeShift->current_balance -= $request->amount;
                    break;
            }

            $activeShift->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transacción registrada correctamente',
                'data' => [
                    'transaction' => $transaction,
                    'shift' => $activeShift
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar la transacción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a pasillera
     */
    public function addPasillera(Request $request)
    {
        $request->validate([
            'user_id' => "required",
            'initial_balance' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        $activeShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        $pasillera = Pasillera::create([
            'cash_shift_id' => $activeShift->id,
            'user_id' => $request->user_id,
            'initial_balance' => $request->initial_balance,
            'current_balance' => $request->initial_balance,
        ]);

        // Load user relationship
        $pasillera->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Pasillera agregada correctamente',
            'data' => $pasillera
        ]);
    }

    /**
     * Add payment to pasillera
     */
    public function addPasilleraPayment(Request $request, $pasilleraId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'machine' => 'required|string',
        ]);

        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        $activeShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        $pasillera = Pasillera::with('user')->where('id', $pasilleraId)
            ->where('cash_shift_id', $activeShift->id)
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'Pasillera no encontrada'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Update pasillera
            $pasillera->total_payments += $request->amount;
            $pasillera->current_balance = $pasillera->initial_balance - $pasillera->total_payments;
            $pasillera->save();

            // Create transaction
            $transaction = CashTransaction::create([
                'cash_shift_id' => $activeShift->id,
                'pasillera_id' => $pasillera->id,
                'type' => 'pasillera_payment',
                'amount' => $request->amount,
                'machine' => $request->machine,
                'description' => 'Pago Pasillera ' . $pasillera->user->first_name . ' ' . $pasillera->user->first_last_name . ' - Máquina: ' . $request->machine,
            ]);

            // Update shift totals
            $activeShift->total_payments += $request->amount;
            $activeShift->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pago registrado correctamente',
                'data' => [
                    'pasillera' => $pasillera,
                    'transaction' => $transaction,
                    'shift' => $activeShift
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset pasillera balance
     */
    public function resetPasillera(Request $request, $pasilleraId)
    {
        $request->validate([
            'new_balance' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        $activeShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        $pasillera = Pasillera::where('id', $pasilleraId)
            ->where('cash_shift_id', $activeShift->id)
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'Pasillera no encontrada'
            ], 404);
        }

        $pasillera->update([
            'initial_balance' => $request->new_balance,
            'total_payments' => 0,
            'current_balance' => $request->new_balance,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pasillera reiniciada correctamente',
            'data' => $pasillera
        ]);
    }

    /**
     * Delete pasillera
     */
    public function deletePasillera($pasilleraId)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        $activeShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        $pasillera = Pasillera::where('id', $pasilleraId)
            ->where('cash_shift_id', $activeShift->id)
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'Pasillera no encontrada'
            ], 404);
        }

        $pasillera->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pasillera eliminada correctamente'
        ]);
    }

    /**
     * Get all transactions for current shift
     */
    public function getTransactions()
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una sucursal asignada'
            ], 400);
        }

        $branchId = $branch->id;

        $activeShift = CashShift::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        $transactions = CashTransaction::where('cash_shift_id', $activeShift->id)
            ->with('pasillera')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }
}
