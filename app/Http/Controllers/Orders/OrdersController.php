<?php

namespace App\Http\Controllers\Orders;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrdersController extends Controller
{
    public function index()
    {
        $orders = Order::with('user')->get();
        $products = Product::all();

        $productsMap = $products->pluck('name', 'id')->toArray();

        $orders = $orders->map(function ($order) use ($productsMap) {
            $order->products = collect($order->products)->map(function ($productId) use ($productsMap) {
                return $productsMap[$productId] ?? 'N/A';
            })->toArray();
            return $order;
        });

        $data = [
            'orders' => $orders,
            'products' => $products
        ];

        return Inertia::render('Orders/index', $data);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user->hasAnyRole(['duenio', 'super-admin'])) {
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

            DB::transaction(function () use ($request) {
                $productId = $request->products[0];
                $product = Product::findOrFail($productId);

                if ($request->quantity > $product->quantity) {
                    throw new \Exception('Stock insuficiente. Disponible: ' . $product->quantity);
                }

                $total = $product->price * $request->quantity;

                $product->quantity -= $request->quantity;
                $product->save();

                Order::create(array_merge($request->only(['products', 'quantity', 'payment_method', 'paid_amount', 'change']), [
                    'total' => $total,
                ]));
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

    public function update(Request $request, Order $order)
    {
        $user = auth()->user();
        if ($user->hasAnyRole(['duenio', 'super-admin'])) {
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

            $order->update($request->only(['products', 'quantity', 'payment_method', 'paid_amount', 'change']));

            return response()->json([
                'message' => 'Orden actualizada exitosamente.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la orden: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Order $order)
    {
        $user = auth()->user();
        if ($user->hasAnyRole(['duenio', 'super-admin'])) {
            abort(403, 'No tienes permiso para realizar esta acción.');
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
}
