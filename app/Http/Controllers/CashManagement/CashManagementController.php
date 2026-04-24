<?php

namespace App\Http\Controllers\CashManagement;

use App\Http\Controllers\Controller;
use App\Models\CashShift;
use App\Models\CashTransaction;
use App\Models\Pasillera;
use App\Events\CashTransactionAdded;
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

        // Get previous shift balance (from any user in the branch)
        $previousShift = CashShift::where('branch_id', $branchId)
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

        // Get previous shift balance (from any user in the branch)
        $previousShift = CashShift::where('branch_id', $branchId)
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
            'simple_mode'     => 'nullable|boolean',
            'opening_total'   => 'nullable|numeric|min:0',
            'opening_20000'   => 'nullable|integer|min:0',
            'opening_10000'   => 'nullable|integer|min:0',
            'opening_5000'    => 'nullable|integer|min:0',
            'opening_2000'    => 'nullable|integer|min:0',
            'opening_1000'    => 'nullable|integer|min:0',
            'opening_coins'   => 'nullable|numeric|min:0',
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

        $simpleMode = filter_var($request->simple_mode, FILTER_VALIDATE_BOOLEAN);

        if ($simpleMode) {
            // Modo simple: el usuario declara directamente el total en caja
            $openingTotalCounted = (float) ($request->opening_total ?? 0);
            $openingDifference = 0; // No calculamos diferencia en modo simple
        } else {
            // Modo desglose: calculamos el total a partir de los billetes
            $openingTotalCounted = (
                ($request->opening_20000 ?? 0) * 20000 +
                ($request->opening_10000 ?? 0) * 10000 +
                ($request->opening_5000 ?? 0) * 5000 +
                ($request->opening_2000 ?? 0) * 2000 +
                ($request->opening_1000 ?? 0) * 1000 +
                ($request->opening_coins ?? 0)
            );
            // El saldo esperado es: saldo anterior + saldo inicial agregado
            $expectedBalance = $previousBalance + $request->initial_balance;
            // Diferencia entre lo contado y lo esperado
            $openingDifference = $openingTotalCounted - $expectedBalance;
        }

        // El turno comienza con el monto declarado
        $shift = CashShift::create([
            'user_id'               => $user->id,
            'branch_id'             => $branchId,
            'previous_balance'      => $previousBalance,
            'initial_balance'       => $request->initial_balance,
            'total_initial_balance' => $previousBalance + $request->initial_balance,
            'current_balance'       => $openingTotalCounted,
            'started_at'            => now(),
            'opening_20000'         => $simpleMode ? 0 : ($request->opening_20000 ?? 0),
            'opening_10000'         => $simpleMode ? 0 : ($request->opening_10000 ?? 0),
            'opening_5000'          => $simpleMode ? 0 : ($request->opening_5000 ?? 0),
            'opening_2000'          => $simpleMode ? 0 : ($request->opening_2000 ?? 0),
            'opening_1000'          => $simpleMode ? 0 : ($request->opening_1000 ?? 0),
            'opening_coins'         => $simpleMode ? 0 : ($request->opening_coins ?? 0),
            'opening_total_counted' => $openingTotalCounted,
            'difference'            => $openingDifference,
        ]);

        $hasDifference = !$simpleMode && $openingDifference != 0;
        $message = $hasDifference
            ? ('Turno iniciado con ' . ($openingDifference > 0 ? 'SOBRANTE' : 'FALTANTE') . ' de $' . number_format(abs($openingDifference), 0, ',', '.') . ' en apertura')
            : 'Turno iniciado correctamente';

        return response()->json([
            'success'           => true,
            'message'           => $message,
            'data'              => $shift,
            'opening_difference'=> $openingDifference,
            'has_difference'    => $hasDifference,
        ]);
    }

    /**
     * End current cash shift
     */
    public function endShift(Request $request)
    {
        $request->validate([
            'simple_mode'   => 'nullable|boolean',
            'closing_total' => 'nullable|numeric|min:0',
            'closing_20000' => 'nullable|integer|min:0',
            'closing_10000' => 'nullable|integer|min:0',
            'closing_5000'  => 'nullable|integer|min:0',
            'closing_2000'  => 'nullable|integer|min:0',
            'closing_1000'  => 'nullable|integer|min:0',
            'closing_coins' => 'nullable|numeric|min:0',
            'closing_notes' => 'nullable|string',
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

        $simpleMode = filter_var($request->simple_mode, FILTER_VALIDATE_BOOLEAN);

        if ($simpleMode) {
            // Modo simple: el usuario declara directamente el total en caja al cierre
            $closingTotalCounted = (float) ($request->closing_total ?? 0);
            $difference = 0; // No calculamos diferencia en modo simple
        } else {
            // Modo desglose: calculamos el total a partir de los billetes
            $closingTotalCounted = (
                ($request->closing_20000 ?? 0) * 20000 +
                ($request->closing_10000 ?? 0) * 10000 +
                ($request->closing_5000  ?? 0) * 5000  +
                ($request->closing_2000  ?? 0) * 2000  +
                ($request->closing_1000  ?? 0) * 1000  +
                ($request->closing_coins ?? 0)
            );
            // Diferencia: lo contado vs lo que debería haber en caja
            $difference = $closingTotalCounted - $activeShift->current_balance;
        }

        $activeShift->update([
            'is_active'             => false,
            'ended_at'              => now(),
            'closing_20000'         => $simpleMode ? 0 : ($request->closing_20000 ?? 0),
            'closing_10000'         => $simpleMode ? 0 : ($request->closing_10000 ?? 0),
            'closing_5000'          => $simpleMode ? 0 : ($request->closing_5000  ?? 0),
            'closing_2000'          => $simpleMode ? 0 : ($request->closing_2000  ?? 0),
            'closing_1000'          => $simpleMode ? 0 : ($request->closing_1000  ?? 0),
            'closing_coins'         => $simpleMode ? 0 : ($request->closing_coins ?? 0),
            'closing_total_counted' => $closingTotalCounted,
            'difference'            => $difference,
            'closing_notes'         => $request->closing_notes,
        ]);

        // Deactivate all pasilleras
        Pasillera::where('cash_shift_id', $activeShift->id)
            ->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Turno cerrado correctamente',
            'data'    => [
                'shift'                 => $activeShift,
                'difference'            => $difference,
                'closing_total_counted' => $closingTotalCounted,
            ]
        ]);
    }

    /**
     * Add a transaction
     */
    public function addTransaction(Request $request)
    {
        $request->validate([
            'type' => 'required|in:transfer,payment,giro,other',
            'amount' => 'required|numeric|min:0',
            'client' => 'nullable|string',
            'machine' => 'nullable|string|max:100',
            'expense_type' => 'nullable|string|max:150',
        ]);

        // Para 'payment' requerimos máquina
        if ($request->type === 'payment' && empty($request->machine)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe indicar el número de máquina para el pago por caja'
            ], 422);
        }

        // Para 'other' requerimos tipo de gasto
        if ($request->type === 'other' && empty($request->expense_type)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe indicar el tipo de gasto'
            ], 422);
        }

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

        // Validar que las salidas no dejen la caja en negativo
        if (in_array($request->type, ['giro', 'payment', 'other'])) {
            if ($request->amount > $activeShift->current_balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo insuficiente. Saldo actual: $' . number_format($activeShift->current_balance, 2, ',', '.')
                        . '. No se puede registrar un monto mayor al saldo disponible.'
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Descripción automática según tipo
            $detailParts = array_filter([
                $request->client,
                $request->machine ? 'Máquina: ' . $request->machine : null,
                $request->expense_type,
            ]);
            $description = $request->type . ' - ' . (count($detailParts) ? implode(' | ', $detailParts) : 'Sin detalle');

            $transaction = CashTransaction::create([
                'cash_shift_id' => $activeShift->id,
                'type' => $request->type,
                'expense_type' => $request->expense_type,
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
                case 'other':
                    $activeShift->total_payments += $request->amount;
                    $activeShift->current_balance -= $request->amount;
                    break;
            }

            $activeShift->save();

            DB::commit();

            // Dispatch broadcasting event
            broadcast(new CashTransactionAdded($transaction, $activeShift, [
                'id' => $user->id,
                'name' => trim($user->first_name . ' ' . ($user->second_name ?? '') . ' ' . $user->first_last_name)
            ]));

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

    /**
     * Set initial value by admin (only when cash register is empty)
     */
    public function setAdminInitialValue(Request $request)
    {
        $request->validate([
            'branch_id' => 'required',
            'admin_initial_value' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        
        // Verificar que el usuario sea admin o super-admin
        if (!in_array($user->role_id, [2, 3])) { // 2=admin, 3=super-admin
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para establecer el valor inicial'
            ], 403);
        }

        $branchId = $request->branch_id;

        // Verificar que no haya turnos activos en esa sucursal
        $activeShift = CashShift::where('branch_id', $branchId)
            ->where('is_active', true)
            ->first();

        if ($activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede establecer el valor inicial porque hay un turno activo en esta sucursal'
            ], 400);
        }

        // Verificar que no haya saldo anterior (caja vacía)
        $lastShift = CashShift::where('branch_id', $branchId)
            ->where('is_active', false)
            ->orderBy('ended_at', 'desc')
            ->first();

        if ($lastShift && $lastShift->current_balance != 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede establecer el valor inicial porque la caja tiene un saldo anterior de $' . number_format($lastShift->current_balance, 0, ',', '.')
            ], 400);
        }

        // Crear un registro especial para el valor inicial del admin
        $shift = CashShift::create([
            'user_id' => $user->id,
            'branch_id' => $branchId,
            'previous_balance' => 0,
            'initial_balance' => $request->admin_initial_value,
            'total_initial_balance' => $request->admin_initial_value,
            'current_balance' => $request->admin_initial_value,
            'admin_initial_value' => $request->admin_initial_value,
            'admin_user_id' => $user->id,
            'admin_value_set_at' => now(),
            'started_at' => now(),
            'ended_at' => now(),
            'is_active' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Valor inicial establecido correctamente',
            'data' => $shift
        ]);
    }
}
