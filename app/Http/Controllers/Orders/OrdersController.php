<?php

namespace App\Http\Controllers\Orders;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrdersController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $branchId = $user->branch_id;
        $filterBranchId = $request->input('branch_id');

        $orders = Order::with('user')
            ->when($branchId, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            })
            ->when(!$branchId && $filterBranchId, function ($query) use ($filterBranchId) {
                $query->where('branch_id', $filterBranchId);
            })
            ->get();

        $products = Product::query()
            ->when($branchId, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            })
            ->when(!$branchId && $filterBranchId, function ($query) use ($filterBranchId) {
                $query->where('branch_id', $filterBranchId);
            })
            ->get();

        $productsMap = $products->pluck('name', 'id')->toArray();

        $orders = $orders->map(function ($order) use ($productsMap) {
            $order->products = collect($order->products)->map(function ($productId) use ($productsMap) {
                return $productsMap[$productId] ?? 'N/A';
            })->toArray();
            return $order;
        });

        $branches = Branch::all();

        // Obtener el acumulador y retiros de la sucursal
        $currentBranchId = $branchId ?: $filterBranchId;
        $salesAccumulator = 0;
        $withdrawals = [];
        if ($currentBranchId) {
            $branch = Branch::find($currentBranchId);
            if ($branch) {
                $salesAccumulator = $branch->sales_accumulator;
                $withdrawals = $branch->withdrawals ?? [];
            }
        }

        $data = [
            'orders' => $orders,
            'products' => $products,
            'branches' => $branches,
            'withdrawals' => $withdrawals,
            'salesAccumulator' => $salesAccumulator
        ];

        return Inertia::render('Orders/index', $data);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['trabajador'])) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        try {
            $request->validate([
                'products' => 'required|array|min:1',
                'quantity' => 'required|integer|min:1',
                'payment_method' => 'required|string|in:efectivo,tarjeta,transferencia',
                'paid_amount' => 'nullable|numeric|min:0',
                'change' => 'nullable|numeric|min:0',
            ]);

            DB::transaction(function () use ($request, $user) {
                $productId = $request->products[0];
                $product = Product::findOrFail($productId);

                if ($user->branch_id && $product->branch_id !== $user->branch_id) {
                    throw new \Exception('No tienes permiso para vender productos de otra sucursal.');
                }

                if ($request->quantity > $product->quantity) {
                    throw new \Exception('Stock insuficiente. Disponible: ' . $product->quantity);
                }

                $total = $product->price * $request->quantity;

                $product->quantity -= $request->quantity;
                $product->save();

                Order::create(array_merge($request->only(['products', 'quantity', 'payment_method', 'paid_amount', 'change']), [
                    'total' => $total,
                    'user_id' => $user->id,
                    'branch_id' => $user->branch_id,
                ]));

                // Incrementar el acumulador de ventas en la sucursal
                $branch = Branch::find($user->branch_id);
                if ($branch) {
                    $branch->increment('sales_accumulator', $total);
                }
            });

            return response()->json([
                'message' => 'Orden creada exitosamente.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear la orden: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Order $order)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['duenio', 'super-admin', 'admin', 'supervisor'])) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        if ($user->branch_id && $order->branch_id !== $user->branch_id) {
            abort(403, 'No tienes permiso para eliminar órdenes de otra sucursal.');
        }

        try {
            $order->delete();

            return response()->json([
                'message' => 'Orden eliminada exitosamente.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la orden: ' . $e->getMessage()
            ], 500);
        }
    }

    public function withdrawSales(Request $request)
    {
        $user = auth()->user();
        
        if (!$user->hasAnyRole(['duenio', 'super-admin', 'admin', 'trabajador'])) {
            return response()->json([
                'message' => 'No tienes permiso para realizar retiros de ventas.'
            ], 403);
        }

        try {
            $request->validate([
                'description' => 'nullable|string|max:1000',
            ]);

            $branchId = $user->branch_id;

            if (!$branchId) {
                return response()->json([
                    'message' => 'No tienes una sucursal asignada.'
                ], 400);
            }

            DB::transaction(function () use ($user, $branchId, $request) {
                $branch = Branch::lockForUpdate()->find($branchId);
                
                if (!$branch) {
                    throw new \Exception('Sucursal no encontrada.');
                }

                $availableAmount = $branch->sales_accumulator;

                // Validar que haya dinero para retirar
                if ($availableAmount <= 0) {
                    throw new \Exception('No hay dinero disponible para retirar.');
                }

                // Obtener el array de retiros actual o inicializar vacío
                $withdrawals = $branch->withdrawals ?? [];

                // Agregar el nuevo retiro al array
                $withdrawals[] = [
                    'date' => now()->toDateTimeString(),
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'amount' => $availableAmount,
                    'description' => $request->description,
                ];

                // Actualizar la sucursal
                $branch->withdrawals = $withdrawals;
                $branch->sales_accumulator = 0;
                $branch->save();
            });

            return response()->json([
                'message' => 'Retiro de ventas registrado exitosamente. El acumulador ha sido reseteado a $0.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al registrar el retiro: ' . $e->getMessage()
            ], 500);
        }
    }
}
