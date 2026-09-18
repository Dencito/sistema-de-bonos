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

        $con = ['cashShift', 'transactions' => fn ($q) => $q->orderBy('created_at', 'desc')];

        // La del turno de caja abierto, esté abierta o ya cerrada.
        //
        // Antes buscaba "activa O cerrada a la fuerza", y una pasillera que
        // cerraba normal no cumplía ninguna de las dos: la consulta se la
        // salteaba y le mostraba una pasillera forzada de un turno viejo, con
        // el saldo y los movimientos de otro día. Justo después de cerrar,
        // que es cuando quiere ver cuánto entregó, veía lo que no era.
        $pasillera = Pasillera::with($con)
            ->where('user_id', $user->id)
            ->whereHas('cashShift', fn ($q) => $q->where('is_active', true))
            ->withTrashed()
            ->orderByDesc('id')
            ->first();

        // Si la caja ya cerró, al menos que vea la suya si quedó abierta
        if (!$pasillera) {
            $pasillera = Pasillera::with($con)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->withTrashed()
                ->orderByDesc('id')
                ->first();
        }

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
        // El mismo criterio que getMyActivePasillera: la ultima. Si quedaron dos
        // activas por error, la pantalla mostraba una y los pagos se registraban
        // contra la otra, asi que el saldo no coincidia y fallaban.
        $pasillera = Pasillera::where('user_id', Auth::id())
            ->where('is_active', true)
            ->orderByDesc('id')
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
        if (in_array($type, [TransactionType::PASILLERA_PAYMENT, TransactionType::PAYMENT, TransactionType::TRAGADOS]) && empty($request->machine)) {
            return 'Debe indicar el número de máquina para ' . (TransactionType::LABELS[$type] ?? 'el pago');
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
     * Devuelve el edit_history del movimiento con una entrada nueva por esta
     * edicion, o el historial intacto si no cambio nada.
     *
     * Solo se anotan los campos que realmente cambiaron: editar sin tocar nada
     * no ensucia el historial. La descripcion no se anota porque se arma sola a
     * partir de los otros campos, seria ruido repetido.
     */
    private function registrarEdicion(CashTransaction $transaction, array $nuevos): array
    {
        $user = Auth::user();
        $seguir = ['amount', 'client', 'machine', 'expense_type'];
        $cambios = [];

        foreach ($seguir as $campo) {
            $antes = $transaction->getOriginal($campo);
            $despues = $nuevos[$campo] ?? null;

            // Comparacion floja a proposito: el monto viene como string
            // "1000.00" desde la base y como float desde el request.
            if ($campo === 'amount') {
                if (abs((float) $antes - (float) $despues) < 0.01) {
                    continue;
                }
            } elseif ((string) $antes === (string) $despues) {
                continue;
            }

            $cambios[$campo] = ['from' => $antes, 'to' => $despues];
        }

        $historial = $transaction->edit_history ?? [];

        if (!$cambios) {
            return $historial;
        }

        $historial[] = [
            // Con zona horaria, como el resto de las fechas de la app.
            // toDateTimeString() devuelve "2026-08-21 08:35:12" sin zona, y el
            // navegador lo interpreta como hora LOCAL suya: despues formatearlo
            // en horario de Chile lo corria una hora hacia atras.
            'at' => now()->toIso8601String(),
            'user_id' => $user?->id,
            'user' => $user ? trim($user->first_name . ' ' . $user->first_last_name) : null,
            'changes' => $cambios,
        ];

        return $historial;
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
        $disponible = (float) $pasillera->current_balance;

        // Sin saldo no es lo mismo que saldo corto: si no le cargaron nada,
        // decirle "insuficiente, disponible $0" no explica que tiene que hacer.
        if ($disponible <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'No tenés carga. Pedile a la cajera que te asigne saldo para poder registrar pagos.',
                'sin_carga' => true,
            ], 422);
        }

        if ($amount > $disponible) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo insuficiente. Te queda $' . number_format($disponible, 0, ',', '.')
                    . ' y estás cargando $' . number_format($amount, 0, ',', '.') . '.',
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
                'message' => 'Saldo insuficiente. Te queda $'
                    . number_format($pasillera->current_balance, 0, ',', '.')
                    . ' y el cambio necesita $' . number_format($delta, 0, ',', '.') . ' más.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $this->applyAmount($cashShift, $pasillera, $transaction->type, $delta);

            $nuevos = [
                'amount' => (float) $request->amount,
                'client' => $request->client,
                'machine' => $request->machine,
                'expense_type' => $request->expense_type,
                'description' => $this->buildDescription($transaction->type, $request),
            ];

            // Antes de pisar los valores se anota que cambio, para que quede el
            // rastro de la correccion: sin esto el monto viejo desaparecia y no
            // habia forma de saber que se habia editado, ni quien ni cuando.
            $nuevos['edit_history'] = $this->registrarEdicion($transaction, $nuevos);

            $transaction->update($nuevos);

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

        // Solo el turno de caja abierto: al cerrarse la caja la pasillera arranca
        // con el historial limpio. Antes filtraba unicamente por usuario, asi que
        // le mostraba todo lo que habia gastado en todos los turnos anteriores.
        //
        // Los movimientos viejos no se borran: siguen en la base y en el historial
        // de cajas, solo dejan de mostrarse acá.
        $activePasillera = Pasillera::where('user_id', $user->id)
            ->where('is_active', true)
            ->whereHas('cashShift', fn($q) => $q->where('is_active', true))
            ->orderByDesc('id')
            ->first();

        if (!$activePasillera) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $transactions = CashTransaction::where('pasillera_id', $activePasillera->id)
            ->where('cash_shift_id', $activePasillera->cash_shift_id)
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
            ->orderByDesc('id')
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
    /**
     * Cierra el turno de la pasillera devolviendo la plata a la caja.
     *
     * `returned_amount` es lo que efectivamente le entrega a la cajera, que no
     * siempre es lo que dice el sistema: puede decir $300 y entregar $250. Lo
     * que entra a la caja es lo entregado, y la diferencia queda anotada como
     * faltante (o sobrante) en vez de desaparecer.
     *
     * Si no se manda el monto, se asume que entregó justo lo que decía el
     * sistema: así las versiones viejas de la app siguen funcionando igual.
     */
    public function finalizeShift(Request $request)
    {
        $request->validate([
            'returned_amount' => 'nullable|numeric|min:0',
            'return_note' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();

        $pasillera = Pasillera::with('cashShift')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->orderByDesc('id')
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una pasillera activa'
            ], 400);
        }

        $esperado = (float) $pasillera->current_balance;
        $entregado = $request->filled('returned_amount')
            ? (float) $request->returned_amount
            : $esperado;
        $diferencia = round($entregado - $esperado, 2);

        DB::beginTransaction();
        try {
            $transaction = null;

            // A la caja entra lo que entregó, no lo que el sistema esperaba
            if ($entregado > 0) {
                $transaction = CashTransaction::create([
                    'cash_shift_id' => $pasillera->cash_shift_id,
                    'pasillera_id' => $pasillera->id,
                    'type' => TransactionType::PASILLERA_RETURN,
                    'source' => TransactionSource::PASILLERA,
                    'amount' => $entregado,
                    'description' => $this->descripcionDevolucion($user, $esperado, $entregado, $diferencia),
                ]);

                $cashShift = CashShift::find($pasillera->cash_shift_id);
                if ($cashShift) {
                    $cashShift->current_balance += $entregado;
                    $cashShift->save();
                }
            }

            // La pasillera queda cerrada en cero: el faltante no vuelve a su
            // saldo, queda registrado en return_difference.
            // initial_balance y total_payments se conservan como historial.
            $pasillera->update([
                'current_balance' => 0,
                'is_active' => false,
                'expected_return' => $esperado,
                'returned_amount' => $entregado,
                'return_difference' => $diferencia,
                'return_note' => $request->return_note,
                'closed_by' => $user->id,
                'closed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $this->mensajeDevolucion($esperado, $entregado, $diferencia),
                'data' => [
                    'returned_balance' => $entregado,
                    'expected_return' => $esperado,
                    'difference' => $diferencia,
                    'transaction' => $transaction,
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

    /**
     * Descripción de la devolución, con la diferencia si la hubo. Es lo que se
     * ve en el historial de caja, así que tiene que contar la historia sola.
     */
    private function descripcionDevolucion($user, float $esperado, float $entregado, float $diferencia): string
    {
        $nombre = trim($user->first_name . ' ' . $user->first_last_name);
        $texto = 'Devolución de saldo al finalizar turno - Pasillera: ' . $nombre;

        if (abs($diferencia) >= 0.01) {
            $texto .= sprintf(
                ' · Esperado $%s, entregó $%s (%s $%s)',
                number_format($esperado, 0, ',', '.'),
                number_format($entregado, 0, ',', '.'),
                $diferencia < 0 ? 'faltan' : 'sobran',
                number_format(abs($diferencia), 0, ',', '.')
            );
        }

        return $texto;
    }

    private function mensajeDevolucion(float $esperado, float $entregado, float $diferencia): string
    {
        $entregadoTxt = '$' . number_format($entregado, 0, ',', '.');

        if (abs($diferencia) < 0.01) {
            return 'Turno finalizado. Entregaste ' . $entregadoTxt . ', justo lo que correspondía.';
        }

        return sprintf(
            'Turno finalizado. Entregaste %s de %s: quedan %s $%s registrados.',
            $entregadoTxt,
            '$' . number_format($esperado, 0, ',', '.'),
            $diferencia < 0 ? 'faltando' : 'sobrando',
            number_format(abs($diferencia), 0, ',', '.')
        );
    }
}
