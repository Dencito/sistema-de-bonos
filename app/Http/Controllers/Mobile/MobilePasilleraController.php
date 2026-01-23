<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Events\PasilleraDataUpdated;
use App\Models\CashShift;
use App\Models\CashTransaction;
use App\Models\Pasillera;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MobilePasilleraController extends Controller
{
    /**
     * Display mobile pasillera interface
     */
    public function index()
    {
        return Inertia::render('Mobile/Pasillera/Index');
    }

    /**
     * Get active pasillera for authenticated user
     */
    public function getMyActivePasillera()
    {
        $user = Auth::user();
        
        // Get active pasillera for this user
        $pasillera = Pasillera::with(['cashShift', 'transactions' => function($query) {
                $query->orderBy('created_at', 'desc');
            }])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una pasillera activa',
                'data' => null
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'pasillera' => $pasillera,
                'user' => [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . ($user->second_name ?? '') . ' ' . $user->first_last_name)
                ]
            ]
        ]);
    }

    /**
     * Register expense/payment on machine
     */
    public function registerExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'machine' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();

        // Get active pasillera
        $pasillera = Pasillera::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una pasillera activa'
            ], 400);
        }

        // Check if has enough balance
        if ($pasillera->current_balance < $request->amount) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo insuficiente. Saldo disponible: $' . number_format($pasillera->current_balance, 0, ',', '.')
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Update pasillera
            $pasillera->total_payments += $request->amount;
            $pasillera->current_balance = $pasillera->initial_balance - $pasillera->total_payments;
            $pasillera->save();

            // Create transaction
            $description = 'Pago Pasillera - Máquina: ' . $request->machine;
            if ($request->description) {
                $description .= ' - ' . $request->description;
            }

            $transaction = CashTransaction::create([
                'cash_shift_id' => $pasillera->cash_shift_id,
                'pasillera_id' => $pasillera->id,
                'type' => 'pasillera_payment',
                'amount' => $request->amount,
                'machine' => $request->machine,
                'description' => $description,
            ]);

            // Update shift totals
            $cashShift = CashShift::find($pasillera->cash_shift_id);
            if ($cashShift) {
                $cashShift->total_payments += $request->amount;
                $cashShift->save();
            }

            DB::commit();

            // Reload pasillera with transactions
            $pasillera->load(['transactions' => function($query) {
                $query->orderBy('created_at', 'desc');
            }]);

            // Dispatch broadcasting event
            \Log::info('Disparando evento PasilleraDataUpdated', [
                'user_id' => $user->id,
                'pasillera_id' => $pasillera->id,
                'transaction_id' => $transaction->id
            ]);
            
            broadcast(new PasilleraDataUpdated([
                'pasillera' => $pasillera,
                'transaction' => $transaction,
                'user' => [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . ($user->second_name ?? '') . ' ' . $user->first_last_name)
                ]
            ]))->toOthers();

            return response()->json([
                'success' => true,
                'message' => 'Gasto registrado correctamente',
                'data' => [
                    'pasillera' => $pasillera,
                    'transaction' => $transaction
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el gasto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get expense history
     */
    public function getExpenseHistory(Request $request)
    {
        $user = Auth::user();
        $limit = $request->input('limit', 50);

        $transactions = CashTransaction::whereHas('pasillera', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('type', 'pasillera_payment')
            ->with(['pasillera', 'cashShift'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Get available machines (you can customize this)
     */
    public function getMachines()
    {
        // This is a placeholder - you can customize based on your needs
        // Could be from database, or dynamic list
        $machines = [
            ['id' => 1, 'name' => 'Máquina 1', 'code' => 'M001'],
            ['id' => 2, 'name' => 'Máquina 2', 'code' => 'M002'],
            ['id' => 3, 'name' => 'Máquina 3', 'code' => 'M003'],
            ['id' => 4, 'name' => 'Máquina 4', 'code' => 'M004'],
            ['id' => 5, 'name' => 'Máquina 5', 'code' => 'M005'],
            ['id' => 6, 'name' => 'Máquina 6', 'code' => 'M006'],
            ['id' => 7, 'name' => 'Máquina 7', 'code' => 'M007'],
            ['id' => 8, 'name' => 'Máquina 8', 'code' => 'M008'],
            ['id' => 9, 'name' => 'Máquina 9', 'code' => 'M009'],
            ['id' => 10, 'name' => 'Máquina 10', 'code' => 'M010'],
        ];

        return response()->json([
            'success' => true,
            'data' => $machines
        ]);
    }

    /**
     * Get current balance
     */
    public function getBalance()
    {
        $user = Auth::user();

        $pasillera = Pasillera::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una pasillera activa',
                'data' => ['balance' => 0]
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'initial_balance' => $pasillera->initial_balance,
                'current_balance' => $pasillera->current_balance,
                'total_payments' => $pasillera->total_payments,
            ]
        ]);
    }

    /**
     * Finalize shift and return remaining balance to bank
     */
    public function finalizeShift(Request $request)
    {
        $user = Auth::user();

        // Get active pasillera
        $pasillera = Pasillera::with('cashShift')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una pasillera activa'
            ], 400);
        }

        $remainingBalance = $pasillera->current_balance;

        DB::beginTransaction();
        try {
            // Create return transaction (devolución de saldo al banco)
            if ($remainingBalance > 0) {
                $transaction = CashTransaction::create([
                    'cash_shift_id' => $pasillera->cash_shift_id,
                    'pasillera_id' => $pasillera->id,
                    'type' => 'pasillera_return',
                    'amount' => $remainingBalance,
                    'description' => 'Devolución de saldo al finalizar turno - Pasillera: ' . $user->first_name . ' ' . $user->first_last_name,
                ]);

                // Update cash shift: add returned balance to current balance
                $cashShift = CashShift::find($pasillera->cash_shift_id);
                if ($cashShift) {
                    $cashShift->current_balance += $remainingBalance;
                    $cashShift->save();
                }
            }

            // Deactivate pasillera
            $pasillera->is_active = false;
            $pasillera->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Turno finalizado correctamente. Saldo devuelto: $' . number_format($remainingBalance, 0, ',', '.'),
                'data' => [
                    'returned_balance' => $remainingBalance,
                    'transaction' => $transaction ?? null
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al finalizar el turno: ' . $e->getMessage()
            ], 500);
        }
    }
}
