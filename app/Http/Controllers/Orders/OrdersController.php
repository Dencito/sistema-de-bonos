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

        $data = [
            'orders' => $orders,
            'products' => $products
        ];

        return Inertia::render('Orders/index', $data);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['duenio', 'super-admin'])) {
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
                // Get the product
                $productId = $request->products[0];  // Since now single product
                $product = Product::findOrFail($productId);

                // Check stock
                if ($request->quantity > $product->quantity) {
                    throw new \Exception('Stock insuficiente. Disponible: ' . $product->quantity);
                }

                // Calculate total
                $total = $product->price * $request->quantity;

                // Deduct stock
                $product->quantity -= $request->quantity;
                $product->save();

                // Create order
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
        if (!$user->hasAnyRole(['duenio', 'super-admin'])) {
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
        if (!$user->hasAnyRole(['duenio', 'super-admin'])) {
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
