<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Events\PasilleraDataUpdated;
use App\Models\CashShift;
use App\Models\CashTransaction;
use App\Models\Pasillera;
use App\Constants\TransactionType;
use App\Constants\TransactionSource;
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

        // Get active pasillera for this user, or force closed pasillera (withTrashed)
        $pasillera = Pasillera::with(['cashShift', 'transactions' => function($query) {
                $query->orderBy('created_at', 'desc');
            }])
            ->where('user_id', $user->id)
            ->where(function($query) {
                $query->where('is_active', true)
                      ->orWhere('force_closed', true);
            })
            ->withTrashed()
            ->orderBy('created_at', 'desc')
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
     * Pasillera activa del usuario autenticado, junto a su turno de caja activo.
     * Devuelve [$pasillera, $cashShift] o [null, null] si algo falta.
     */
    private function resolveActiveContext(): array
    {
        $pasillera = Pasillera::where('user_id', Auth::id())
            ->where('is_active', true)
            ->first();

        if (!$pasillera) {
            return [null, null];
        }

        $cashShift = CashShift::where('id', $pasillera->cash_shift_id)
            ->where('is_active', true)
            ->first();

        return [$pasillera, $cashShift];
    }

    /**
     * Campos obligatorios según el tipo. Devuelve el mensaje de error o null.
     */
    private function checkTypeRequirements(string $type, Request $request): ?string
    {
        if (in_array($type, [TransactionType::PASILLERA_PAYMENT, TransactionType::PAYMENT]) && empty($request->machine)) {
            return 'Debe indicar el número de máquina para el pago';
        }

        if ($type === TransactionType::OTHER && empty($request->expense_type)) {
            return 'Debe indicar el tipo de gasto';
        }

        return null;
    }

    /**
     * Arma la descripción legible de una transacción de pasillera.
     */
    private function buildDescription(string $type, Request $request): string
    {
        // Formato histórico del pago de pasillera, se mantiene por compatibilidad
        if ($type === TransactionType::PASILLERA_PAYMENT) {
            $description = 'Pago Pasillera - Máquina: ' . $request->machine;
            if ($request->description) {
                $description .= ' - ' . $request->description;
            }
            return $description;
        }

        $detailParts = array_filter([
            $request->client,
            $request->machine ? 'Máquina: ' . $request->machine : null,
            $request->expense_type,
            $request->description,
        ]);

        return $type . ' - ' . (count($detailParts) ? implode(' | ', $detailParts) : 'Sin detalle');
    }

    /**
     * Aplica un monto a los totales del turno y al saldo propio de la pasillera.
     * $delta positivo suma gasto, negativo lo revierte.
     *
     * NUNCA toca current_balance del turno: ese dinero ya salió de la caja cuando
     * la cajera le asignó el saldo a la pasillera. Descontarlo acá sería contarlo dos veces.
     */
    private function applyAmount(CashShift $cashShift, Pasillera $pasillera, string $type, float $delta): void
    {
        $totalCol = TransactionType::TOTAL_COLUMNS[$type] ?? null;
        $pasilleraCol = TransactionType::PASILLERA_TOTAL_COLUMNS[$type] ?? null;

        if ($totalCol) {
            $cashShift->{$totalCol} += $delta;
        }
        if ($pasilleraCol) {
            $cashShift->{$pasilleraCol} += $delta;
        }
        $cashShift->save();

        $pasillera->total_payments += $delta;
        $pasillera->current_balance = $pasillera->initial_balance - $pasillera->total_payments;
        $pasillera->save();
    }

    private function broadcastUpdate(Pasillera $pasillera, ?CashTransaction $transaction): void
    {
        $user = Auth::user();

        broadcast(new PasilleraDataUpdated([
            'pasillera' => $pasillera,
            'transaction' => $transaction,
            'user' => [
                'id' => $user->id,
                'name' => trim($user->first_name . ' ' . ($user->second_name ?? '') . ' ' . $user->first_last_name)
            ]
        ]))->toOthers();
    }

    /**
     * Registra cualquier tipo de transacción hecha por la pasillera.
     *
     * Siempre source='pasillera': suma a total_X y a total_X_pasillera del turno,
     * y descuenta del saldo propio de la pasillera. El saldo de caja no se toca.
     */
    public function registerTransaction(Request $request)
    {
        $request->validate([
            'type' => 'required|in:' . implode(',', TransactionType::PASILLERA_CREABLE),
            'amount' => 'required|numeric|min:0.01',
            'client' => 'nullable|string|max:255',
            'machine' => 'nullable|string|max:255',
            'expense_type' => 'nullable|string|max:150',
            'description' => 'nullable|string|max:500',
            'image' => 'nullable|image|max:5120',
        ]);

        [$pasillera, $cashShift] = $this->resolveActiveContext();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una pasillera activa'
            ], 400);
        }

        if (!$cashShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo para esta pasillera'
            ], 400);
        }

        $type = $request->type;

        if ($error = $this->checkTypeRequirements($type, $request)) {
            return response()->json(['success' => false, 'message' => $error], 422);
        }

        $amount = (float) $request->amount;

        if ($amount > (float) $pasillera->current_balance) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo insuficiente en pasillera. Disponible: $' . number_format($pasillera->current_balance, 0, ',', '.')
            ], 422);
        }

        DB::beginTransaction();
        try {
            $imagePath = $request->hasFile('image')
                ? $request->file('image')->store('expense-images', 'public')
                : null;

            $transaction = CashTransaction::create([
                'cash_shift_id' => $cashShift->id,
                'pasillera_id' => $pasillera->id,
                'type' => $type,
                'source' => TransactionSource::PASILLERA,
                'amount' => $amount,
                'client' => $request->client,
                'machine' => $request->machine,
                'expense_type' => $request->expense_type,
                'description' => $this->buildDescription($type, $request),
                'image' => $imagePath,
                'admin_user_id' => Auth::id(),
            ]);

            $this->applyAmount($cashShift, $pasillera, $type, $amount);

            DB::commit();

            $pasillera->load(['transactions' => function($query) {
                $query->orderBy('created_at', 'desc');
            }]);

            $this->broadcastUpdate($pasillera, $transaction);

            return response()->json([
                'success' => true,
                'message' => (TransactionType::LABELS[$type] ?? 'Transacción') . ' registrado correctamente',
                'data' => [
                    'pasillera' => $pasillera,
                    'transaction' => $transaction,
                    'shift' => $cashShift,
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
     * Edita una transacción propia de la pasillera (turno activo, sin cambiar el tipo).
     */
    public function updateTransaction(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'client' => 'nullable|string|max:255',
            'machine' => 'nullable|string|max:255',
            'expense_type' => 'nullable|string|max:150',
            'description' => 'nullable|string|max:500',
        ]);

        [$pasillera, $cashShift] = $this->resolveActiveContext();

        if (!$pasillera) {
            return response()->json(['success' => false, 'message' => 'No tienes una pasillera activa'], 400);
        }

        $transaction = CashTransaction::find($id);

        if (!$transaction || $transaction->pasillera_id != $pasillera->id) {
            return response()->json(['success' => false, 'message' => 'Transacción no encontrada en tu pasillera'], 404);
        }

        // pasillera_return y los movimientos de saldo los maneja la caja, no la pasillera
        if ($transaction->source !== TransactionSource::PASILLERA
            || !in_array($transaction->type, TransactionType::PASILLERA_CREABLE)) {
            return response()->json(['success' => false, 'message' => 'Esta transacción no se puede editar desde la app'], 400);
        }

        if (!$cashShift || $cashShift->id != $transaction->cash_shift_id) {
            return response()->json(['success' => false, 'message' => 'Solo se puede editar mientras el turno esté activo'], 400);
        }

        if ($error = $this->checkTypeRequirements($transaction->type, $request)) {
            return response()->json(['success' => false, 'message' => $error], 422);
        }

        $delta = (float) $request->amount - (float) $transaction->amount;

        if ($delta > (float) $pasillera->current_balance) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo insuficiente en la pasillera. Disponible: $' . number_format($pasillera->current_balance, 0, ',', '.')
            ], 422);
        }

        DB::beginTransaction();
        try {
            $this->applyAmount($cashShift, $pasillera, $transaction->type, $delta);

            $transaction->update([
                'amount' => (float) $request->amount,
                'client' => $request->client,
                'machine' => $request->machine,
                'expense_type' => $request->expense_type,
                'description' => $this->buildDescription($transaction->type, $request),
            ]);

            DB::commit();

            $pasillera->load(['transactions' => function($query) {
                $query->orderBy('created_at', 'desc');
            }]);

            $this->broadcastUpdate($pasillera, $transaction);

            return response()->json([
                'success' => true,
                'message' => 'Transacción actualizada correctamente',
                'data' => [
                    'pasillera' => $pasillera,
                    'transaction' => $transaction,
                    'shift' => $cashShift,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Elimina una transacción propia de la pasillera (turno activo).
     */
    public function deleteTransaction($id)
    {
        [$pasillera, $cashShift] = $this->resolveActiveContext();

        if (!$pasillera) {
            return response()->json(['success' => false, 'message' => 'No tienes una pasillera activa'], 400);
        }

        $transaction = CashTransaction::find($id);

        if (!$transaction || $transaction->pasillera_id != $pasillera->id) {
            return response()->json(['success' => false, 'message' => 'Transacción no encontrada en tu pasillera'], 404);
        }

        if ($transaction->source !== TransactionSource::PASILLERA
            || !in_array($transaction->type, TransactionType::PASILLERA_CREABLE)) {
            return response()->json(['success' => false, 'message' => 'Esta transacción no se puede eliminar desde la app'], 400);
        }

        if (!$cashShift || $cashShift->id != $transaction->cash_shift_id) {
            return response()->json(['success' => false, 'message' => 'Solo se puede eliminar mientras el turno esté activo'], 400);
        }

        DB::beginTransaction();
        try {
            $this->applyAmount($cashShift, $pasillera, $transaction->type, -1 * (float) $transaction->amount);

            $transaction->delete();

            DB::commit();

            $pasillera->load(['transactions' => function($query) {
                $query->orderBy('created_at', 'desc');
            }]);

            $this->broadcastUpdate($pasillera, null);

            return response()->json([
                'success' => true,
                'message' => 'Transacción eliminada correctamente',
                'data' => [
                    'pasillera' => $pasillera,
                    'shift' => $cashShift,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error al eliminar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Registro de pago de máquina. Alias legacy de registerTransaction para las
     * versiones de la app que todavía apuntan a /pasillera/expense.
     */
    public function registerExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'machine' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $request->merge(['type' => TransactionType::PASILLERA_PAYMENT]);

        return $this->registerTransaction($request);
    }

    /**
     * Alias legacy de updateTransaction.
     */
    public function updateExpense(Request $request, $id)
    {
        return $this->updateTransaction($request, $id);
    }

    /**
     * Alias legacy de deleteTransaction.
     */
    public function deleteExpense($id)
    {
        return $this->deleteTransaction($id);
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
                    'type' => TransactionType::PASILLERA_RETURN,
                    'source' => TransactionSource::PASILLERA,
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

            // El saldo volvió a la caja: la pasillera queda en cero.
            // initial_balance y total_payments se conservan como historial de lo asignado y gastado.
            $pasillera->current_balance = 0;
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
