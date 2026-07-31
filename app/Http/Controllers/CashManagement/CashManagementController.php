<?php

namespace App\Http\Controllers\CashManagement;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CashShift;
use App\Models\CashTransaction;
use App\Models\Pasillera;
use App\Models\User;
use App\Events\CashTransactionAdded;
use App\Constants\RoleId;
use App\Constants\TransactionType;
use App\Constants\TransactionSource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class CashManagementController extends Controller
{
    /**
     * Sucursal sobre la que opera la petición.
     *
     * Los trabajadores y supervisores usan siempre la suya. Los roles superiores
     * (dueño, super-admin, admin) no tienen sucursal asignada: eligen una y la
     * mandan en `branch_id`.
     */
    private function resolveBranch(Request $request): ?Branch
    {
        $user = Auth::user();

        if (RoleId::canSelectBranch($user->role_id)) {
            $branchId = $request->input('branch_id') ?: $user->branch_id;

            return $branchId ? Branch::find($branchId) : null;
        }

        return $user->branch;
    }

    private function noBranchResponse()
    {
        $message = RoleId::canSelectBranch(Auth::user()->role_id)
            ? 'Seleccioná una sucursal para operar'
            : 'No tienes una sucursal asignada';

        return response()->json(['success' => false, 'message' => $message], 400);
    }

    /**
     * Turno activo de la sucursal, sea de quien sea.
     */
    private function findActiveShift(int $branchId, array $with = []): ?CashShift
    {
        // Sin filtrar por usuario: hay un solo cajón de dinero por sucursal, así
        // que el turno abierto es el de la sucursal y lo tiene que ver cualquiera
        // que trabaje ahí, sea suyo o no. Si se filtrara por usuario, una cajera
        // no vería el turno que dejó abierto su compañera y no podría cerrarlo.
        //
        // resolveBranch() ya limita a la sucursal del usuario, así que esto no
        // expone turnos de otras sucursales.
        //
        // Se ordena por id y no por started_at porque started_at viene siendo
        // reescrito por la base en cada update (ver fix_cash_shifts_started_at.sql).
        return CashShift::with($with)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->orderByDesc('id')
            ->first();
    }

    /**
     * ¿El usuario puede intervenir este turno?
     *
     * Como el cajón es uno por sucursal, quien esté atendiendo opera el turno
     * abierto aunque lo haya abierto otra persona: si no, la que quedó de turno
     * no podría registrar movimientos ni cerrar la caja que le dejaron abierta.
     * Cada movimiento igual queda registrado a nombre de quien lo hace
     * (admin_user_id), así que la trazabilidad no se pierde.
     *
     * Los roles superiores además pueden operar sobre la sucursal que eligieron.
     */
    private function canOperateShift(CashShift $shift): bool
    {
        $user = Auth::user();

        if ($shift->user_id === $user->id || RoleId::canSelectBranch($user->role_id)) {
            return true;
        }

        return $user->branch_id !== null && $shift->branch_id === $user->branch_id;
    }

    /**
     * Sucursales entre las que puede elegir el usuario.
     */
    private function selectableBranches()
    {
        if (!RoleId::canSelectBranch(Auth::user()->role_id)) {
            return collect();
        }

        return Branch::select('id', 'name')->orderBy('name')->get();
    }

    /**
     * Display the cash management page
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $branches = $this->selectableBranches();
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return Inertia::render('SystemBank/Index', [
                'activeShift' => null,
                'previousBalance' => 0,
                'availableUsers' => [],
                'branch' => null,
                'branches' => $branches,
                'canSelectBranch' => RoleId::canSelectBranch($user->role_id),
                'tickets' => [],
                'error' => RoleId::canSelectBranch($user->role_id)
                    ? null
                    : 'No tienes una sucursal asignada',
            ]);
        }

        $branchId = $branch->id;

        // Get active shift if exists
        $activeShift = $this->findActiveShift($branchId, [
            'transactions.adminUser',
            'pasilleras.transactions',
            'pasilleras.user',
            'user:id,username,first_name,second_name,first_last_name',
        ]);

        // Get tickets for the active shift period
        $tickets = [];
        if ($activeShift) {
            $shiftStart = $activeShift->started_at;
            $shiftEnd = $activeShift->ended_at ?? now();

            $tickets = \App\Models\Ticket::with(['user', 'branch'])
                ->where('branch_id', $branchId)
                ->whereBetween('created_at', [$shiftStart, $shiftEnd])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($ticket) {
                    return [
                        'id' => $ticket->id,
                        'type' => 'ticket',
                        'source' => 'ticket',
                        'amount' => $ticket->total_amount,
                        'ticket_number' => $ticket->ticket_number,
                        'description' => 'Ticket #' . $ticket->ticket_number,
                        'created_at' => $ticket->created_at,
                        'user' => [
                            'first_name' => $ticket->user->first_name,
                            'first_last_name' => $ticket->user->first_last_name,
                        ],
                    ];
                });
        }

        // Get previous shift balance (from any user in the branch)
        $previousShift = CashShift::where('branch_id', $branchId)
            ->where('is_active', false)
            ->orderBy('ended_at', 'desc')
            ->first();

        // Get available users for pasilleras (only users with cargo 'PASILLER@')
        $availableUsers = \App\Models\User::whereJsonContains('cargo', 'PASILLER@')
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
            'branch' => ['id' => $branch->id, 'name' => $branch->name],
            'branches' => $branches,
            'canSelectBranch' => RoleId::canSelectBranch($user->role_id),
            'tickets' => $tickets,
        ]);
    }

    /**
     * Get current shift status
     */
    public function getShiftStatus(Request $request)
    {
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        $activeShift = $this->findActiveShift($branchId, [
            'transactions.adminUser:id,first_name,second_name,first_last_name',
            'transactions.pasillera.user:id,first_name,first_last_name',
            'pasilleras.transactions',
            'pasilleras.user:id,first_name,first_last_name',
            'user:id,username,first_name,second_name,first_last_name',
        ]);

        // Get previous shift balance (from any user in the branch)
        $previousShift = CashShift::where('branch_id', $branchId)
            ->where('is_active', false)
            ->orderBy('ended_at', 'desc')
            ->first();

        // Calculate total tickets for the active shift
        $totalTickets = 0;
        if ($activeShift) {
            $shiftStart = $activeShift->started_at;
            $shiftEnd = $activeShift->ended_at ?? now();

            $totalTickets = \App\Models\Ticket::where('branch_id', $branchId)
                ->whereBetween('created_at', [$shiftStart, $shiftEnd])
                ->sum('total_amount');
        }

        return response()->json([
            'success' => true,
            'data' => [
                'activeShift' => $activeShift,
                'previousBalance' => $previousShift ? $previousShift->current_balance : 0,
                'totalTickets' => $totalTickets,
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
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        // La guarda mira TODA la sucursal, no solo los turnos del usuario: hay un
        // solo cajón de dinero por sucursal y hasta que no se cierre el turno
        // abierto no se puede abrir otro, aunque lo haya abierto otra persona.
        $activeShift = $this->findActiveShift($branchId, ['user']);

        if ($activeShift) {
            $owner = $activeShift->user
                ? trim($activeShift->user->first_name . ' ' . $activeShift->user->first_last_name)
                : null;

            return response()->json([
                'success' => false,
                'message' => $owner && $activeShift->user_id !== $user->id
                    ? "La caja de {$branch->name} ya tiene un turno abierto por {$owner}. Hay que cerrarlo antes de abrir otro."
                    : 'Ya existe un turno activo',
            ], 400);
        }

        // Get previous shift balance (from any user in the branch)
        $previousShift = CashShift::where('branch_id', $branchId)
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
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        $activeShift = $this->findActiveShift($branchId);

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
            'current_balance'       => $closingTotalCounted,
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
            'type' => 'required|in:' . implode(',', TransactionType::USER_CREABLE),
            'amount' => 'required|numeric|min:0',
            'client' => 'nullable|string',
            'machine' => 'nullable|string|max:100',
            'expense_type' => 'nullable|string|max:150',
            'image' => 'nullable|image|max:5120',
            'admin_user_id' => 'nullable|integer',
        ]);

        // 'payment' y 'tragados' se registran siempre contra una máquina
        if (in_array($request->type, [TransactionType::PAYMENT, TransactionType::TRAGADOS]) && empty($request->machine)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe indicar el número de máquina para ' . TransactionType::LABELS[$request->type]
            ], 422);
        }

        // Para 'other' requerimos tipo de gasto
        if ($request->type === TransactionType::OTHER && empty($request->expense_type)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe indicar el tipo de gasto'
            ], 422);
        }

        $user = Auth::user();
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        // Este endpoint es exclusivamente de caja: siempre source='caja' y siempre
        // sobre el turno propio del usuario. Las transacciones de pasillera se
        // registran desde la app mobile (MobilePasilleraController).
        $activeShift = $this->findActiveShift($branchId);

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        // Validar saldo - desde la web siempre es caja
        if (in_array($request->type, TransactionType::TYPES_THAT_REDUCE_BALANCE)) {
            if ($request->amount > $activeShift->current_balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo insuficiente. Saldo disponible: $' . number_format($activeShift->current_balance, 0, ',', '.')
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Procesar imagen si se envió
            $imagePath = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imagePath = $image->store('expense-images', 'public');
            }

            // Descripción automática según tipo
            $detailParts = array_filter([
                $request->client,
                $request->machine ? 'Máquina: ' . $request->machine : null,
                $request->expense_type,
                $request->description,
            ]);

            // Etiqueta legible para depósitos/retiros
            if ($request->type === TransactionType::DEPOSIT) {
                $detailParts[] = 'Agregar Dinero';
            } elseif ($request->type === TransactionType::WITHDRAWAL) {
                $detailParts[] = 'Quitar Dinero';
            }

            // Incluir admin que autorizó
            if ($request->admin_user_id) {
                $adminUser = User::find($request->admin_user_id);
                if ($adminUser) {
                    $adminName = trim($adminUser->first_name . ' ' . $adminUser->first_last_name);
                    $detailParts[] = 'Autorizado por: ' . $adminName;
                }
            }

            $description = $request->type . ' - ' . (count($detailParts) ? implode(' | ', $detailParts) : 'Sin detalle');

            $transaction = CashTransaction::create([
                'cash_shift_id' => $activeShift->id,
                'pasillera_id' => null,
                'type' => $request->type,
                'source' => TransactionSource::CAJA,
                'expense_type' => $request->expense_type,
                'amount' => $request->amount,
                'client' => $request->client,
                'machine' => $request->machine,
                'description' => $description,
                'image' => $imagePath,
                'admin_user_id' => $request->admin_user_id ?: $user->id,
            ]);

            // Update shift totals
            $totalCol = TransactionType::TOTAL_COLUMNS[$request->type] ?? null;
            if ($totalCol) {
                $activeShift->{$totalCol} += $request->amount;
            }

            // Afectar saldo del turno (siempre es caja desde la web)
            if (in_array($request->type, TransactionType::TYPES_THAT_REDUCE_BALANCE)) {
                $activeShift->current_balance -= $request->amount;
            } elseif ($request->type === TransactionType::DEPOSIT) {
                $activeShift->current_balance += $request->amount;
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
     * Update an existing transaction (only while shift is active)
     * Allowed types: transfer, giro, payment, other
     * Type itself cannot be changed, only amount/client/machine/expense_type/description
     */
    public function updateTransaction(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'client' => 'nullable|string',
            'machine' => 'nullable|string|max:100',
            'expense_type' => 'nullable|string|max:150',
            'description' => 'nullable|string',
        ]);

        $user = Auth::user();
        $transaction = CashTransaction::findOrFail($id);
        $activeShift = CashShift::find($transaction->cash_shift_id);

        if (!$activeShift || !$activeShift->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden editar transacciones del turno activo'
            ], 400);
        }

        if (!$this->canOperateShift($activeShift)) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes modificar transacciones de otro turno'
            ], 403);
        }

        // Las transacciones de pasillera solo se editan desde la app de pasillera:
        // ahí se ajusta su saldo propio sin tocar el saldo de caja.
        if ($transaction->source === TransactionSource::PASILLERA) {
            return response()->json([
                'success' => false,
                'message' => 'Las transacciones de pasillera se editan desde la app de la pasillera'
            ], 403);
        }

        if (!in_array($transaction->type, TransactionType::USER_CREABLE)) {
            return response()->json([
                'success' => false,
                'message' => 'Este tipo de transacción no se puede editar desde aquí'
            ], 400);
        }

        if (in_array($transaction->type, [TransactionType::PAYMENT, TransactionType::TRAGADOS]) && empty($request->machine)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe indicar el número de máquina'
            ], 422);
        }

        if ($transaction->type === TransactionType::OTHER && empty($request->expense_type)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe indicar el tipo de gasto'
            ], 422);
        }

        $oldAmount = (float) $transaction->amount;
        $newAmount = (float) $request->amount;
        $delta = $newAmount - $oldAmount;

        DB::beginTransaction();
        try {
            // Actualizar total general (la columna _pasillera no aplica: esto es siempre caja)
            $totalCol = TransactionType::TOTAL_COLUMNS[$transaction->type] ?? null;
            if ($totalCol) {
                $activeShift->{$totalCol} += $delta;
            }

            // Validar saldo y afectar balance del turno
            if (in_array($transaction->type, TransactionType::TYPES_THAT_REDUCE_BALANCE)) {
                if ($delta > 0 && $activeShift->current_balance < $delta) {
                    throw new \Exception('Saldo insuficiente para aumentar el monto');
                }
                $activeShift->current_balance -= $delta;
            } elseif ($transaction->type === TransactionType::DEPOSIT) {
                $activeShift->current_balance += $delta;
            }

            $activeShift->save();

            $transaction->update([
                'amount' => $newAmount,
                'client' => $request->client,
                'machine' => $request->machine,
                'expense_type' => $request->expense_type,
                'description' => $request->description ?: $transaction->description,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transacción actualizada correctamente',
                'data' => [
                    'transaction' => $transaction->fresh(),
                    'shift' => $activeShift->fresh(),
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a transaction (only while shift is active)
     */
    public function deleteTransaction(Request $request, $id)
    {
        $user = Auth::user();
        $transaction = CashTransaction::findOrFail($id);
        $activeShift = CashShift::find($transaction->cash_shift_id);

        if (!$activeShift || !$activeShift->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden eliminar transacciones del turno activo'
            ], 400);
        }

        if (!$this->canOperateShift($activeShift)) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes eliminar transacciones de otro turno'
            ], 403);
        }

        // Las transacciones de pasillera solo se eliminan desde la app de pasillera
        if ($transaction->source === TransactionSource::PASILLERA) {
            return response()->json([
                'success' => false,
                'message' => 'Las transacciones de pasillera se eliminan desde la app de la pasillera'
            ], 403);
        }

        $amount = (float) $transaction->amount;

        // Un deposit con pasillera_id es un "agregar saldo a la pasillera": movimiento
        // interno que resta de caja y no suma a total_deposit. Se revierte al revés.
        $isBalanceToPasillera = $transaction->type === TransactionType::DEPOSIT && $transaction->pasillera_id;

        $pasillera = $isBalanceToPasillera ? Pasillera::find($transaction->pasillera_id) : null;

        if ($isBalanceToPasillera && $pasillera && (float) $pasillera->current_balance < $amount) {
            return response()->json([
                'success' => false,
                'message' => 'La pasillera ya gastó parte de ese saldo. Disponible: $' . number_format($pasillera->current_balance, 0, ',', '.')
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Revertir total general (el saldo asignado a la pasillera nunca sumó a total_deposit)
            $totalCol = TransactionType::TOTAL_COLUMNS[$transaction->type] ?? null;
            if ($totalCol && !$isBalanceToPasillera) {
                $activeShift->{$totalCol} -= $amount;
            }

            // Revertir saldo del turno
            if ($isBalanceToPasillera) {
                $activeShift->current_balance += $amount;

                if ($pasillera) {
                    $pasillera->initial_balance -= $amount;
                    $pasillera->current_balance = $pasillera->initial_balance - $pasillera->total_payments;
                    $pasillera->save();
                }
            } elseif (in_array($transaction->type, TransactionType::TYPES_THAT_REDUCE_BALANCE)) {
                $activeShift->current_balance += $amount;
            } elseif ($transaction->type === TransactionType::DEPOSIT) {
                $activeShift->current_balance -= $amount;
            }

            $activeShift->save();
            $transaction->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transacción eliminada correctamente',
                'data' => ['shift' => $activeShift->fresh()]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar: ' . $e->getMessage()
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
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        $activeShift = $this->findActiveShift($branchId);

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        DB::beginTransaction();
        try {
            $pasillera = Pasillera::create([
                'cash_shift_id' => $activeShift->id,
                'user_id' => $request->user_id,
                'initial_balance' => $request->initial_balance,
                'current_balance' => $request->initial_balance,
            ]);

            // Restar el dinero asignado del saldo de caja
            $activeShift->current_balance -= $request->initial_balance;
            $activeShift->save();

            DB::commit();

            // Load user relationship
            $pasillera->load('user');

            return response()->json([
                'success' => true,
                'message' => 'Pasillera agregada correctamente',
                'data' => $pasillera
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al agregar pasillera: ' . $e->getMessage()
            ], 500);
        }
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
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        $activeShift = $this->findActiveShift($branchId);

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
                'type' => TransactionType::PASILLERA_PAYMENT,
                'source' => TransactionSource::PASILLERA,
                'amount' => $request->amount,
                'machine' => $request->machine,
                'description' => 'Pago Pasillera ' . $pasillera->user->first_name . ' ' . $pasillera->user->first_last_name . ' - Máquina: ' . $request->machine,
            ]);

            // Update shift totals (solo para estadísticas, no afecta current_balance porque el dinero ya salió al asignar la pasillera)
            $activeShift->total_payments += $request->amount;
            $activeShift->total_payments_pasillera += $request->amount;
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
     * Add balance to pasillera (adds money from caja to pasillera)
     */
    public function addBalanceToPasillera(Request $request, $pasilleraId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = Auth::user();
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        $activeShift = $this->findActiveShift($branchId);

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        // Validar saldo de caja
        if ($request->amount > $activeShift->current_balance) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo insuficiente en caja. Saldo disponible: $' . number_format($activeShift->current_balance, 0, ',', '.')
            ], 422);
        }

        $pasillera = Pasillera::where('id', $pasilleraId)
            ->where('cash_shift_id', $activeShift->id)
            ->where('is_active', true)
            ->first();

        if (!$pasillera) {
            return response()->json([
                'success' => false,
                'message' => 'Pasillera no encontrada o inactiva'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Actualizar saldo de pasillera
            $pasillera->initial_balance += $request->amount;
            $pasillera->current_balance = $pasillera->initial_balance - $pasillera->total_payments;
            $pasillera->save();

            // Restar de la caja
            $activeShift->current_balance -= $request->amount;
            // No incrementa total_deposit porque es un movimiento interno, no un depósito real
            $activeShift->save();

            // Registrar transacción
            $pasilleraName = trim($pasillera->user->first_name . ' ' . $pasillera->user->first_last_name);
            $transaction = CashTransaction::create([
                'cash_shift_id' => $activeShift->id,
                'pasillera_id' => $pasillera->id,
                'type' => TransactionType::DEPOSIT,
                'source' => TransactionSource::CAJA,
                'amount' => $request->amount,
                'description' => "Agregar saldo a Pasillera - {$pasilleraName}",
                'admin_user_id' => $user->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Saldo agregado correctamente a la pasillera',
                'data' => [
                    'pasillera' => $pasillera->fresh(),
                    'transaction' => $transaction,
                    'shift' => $activeShift->fresh(),
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al agregar saldo: ' . $e->getMessage()
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
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        $activeShift = $this->findActiveShift($branchId);

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
    public function deletePasillera(Request $request, $pasilleraId)
    {
        $user = Auth::user();
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        $activeShift = $this->findActiveShift($branchId);

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
            // Si tiene saldo restante, crear autoreintegro
            if ($pasillera->current_balance > 0) {
                $pasilleraName = trim($pasillera->user->first_name . ' ' . $pasillera->user->first_last_name);
                $transaction = CashTransaction::create([
                    'cash_shift_id' => $activeShift->id,
                    'pasillera_id' => $pasillera->id,
                    'type' => TransactionType::PASILLERA_RETURN,
                    'source' => TransactionSource::PASILLERA,
                    'amount' => $pasillera->current_balance,
                    'description' => "Cierre forzado - Autoreintegro - {$pasilleraName}",
                    'admin_user_id' => $user->id,
                ]);

                // Devolver el saldo a la caja
                $activeShift->current_balance += $pasillera->current_balance;
                $activeShift->save();
            }

            // Marcar como inactiva y force_closed
            $pasillera->is_active = false;
            $pasillera->force_closed = true;
            $pasillera->save();

            // Soft delete (no borrar físicamente)
            $pasillera->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pasillera cerrada forzosamente con autoreintegro'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar pasillera: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all transactions for current shift
     */
    public function getTransactions(Request $request)
    {
        $user = Auth::user();
        $branch = $this->resolveBranch($request);

        if (!$branch) {
            return $this->noBranchResponse();
        }

        $branchId = $branch->id;

        $activeShift = $this->findActiveShift($branchId);

        if (!$activeShift) {
            return response()->json([
                'success' => false,
                'message' => 'No hay turno activo'
            ], 400);
        }

        $transactions = CashTransaction::where('cash_shift_id', $activeShift->id)
            ->with('pasillera.user:id,first_name,first_last_name')
            ->with('adminUser:id,first_name,second_name,first_last_name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Obtener tickets del turno activo (entre apertura y cierre)
        $tickets = \App\Models\Ticket::where('branch_id', $branchId)
            ->where('created_at', '>=', $activeShift->started_at)
            ->where(function ($query) use ($activeShift) {
                if ($activeShift->ended_at) {
                    $query->where('created_at', '<=', $activeShift->ended_at);
                }
            })
            ->with('user:id,first_name,first_last_name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($ticket) {
                return [
                    'id' => $ticket->id,
                    'type' => 'ticket',
                    'source' => 'ticket',
                    'amount' => $ticket->total_amount,
                    'ticket_number' => $ticket->ticket_number,
                    'description' => 'Ticket #' . $ticket->ticket_number,
                    'created_at' => $ticket->created_at,
                    'user' => [
                        'first_name' => $ticket->user->first_name,
                        'first_last_name' => $ticket->user->first_last_name,
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $transactions,
                'tickets' => $tickets,
            ]
        ]);
    }

    /**
     * Validate user credentials for admin operations
     */
    public function validateCredentials(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Contraseña incorrecta'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => trim($user->first_name . ' ' . ($user->second_name ?? '') . ' ' . $user->first_last_name),
            ]
        ]);
    }

    /**
     * Validate current user password for session unlock
     */
    public function validateCurrentPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Contraseña incorrecta'
            ], 401);
        }

        return response()->json([
            'success' => true,
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
