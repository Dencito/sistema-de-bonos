<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProductsController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['duenio', 'super-admin', 'admin', 'supervisor'])) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }

        $products = Product::all();

        $data = [
            'products' => $products
        ];
        return Inertia::render('Products/index', $data);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['duenio', 'super-admin', 'admin', 'supervisor'])) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:255|unique:' . (new Product)->getTable() . ',code',
                'price' => 'required|numeric|min:0',
                'quantity' => 'required|integer|min:0',
            ]);

            Product::create($request->only(['name', 'code', 'price', 'quantity']));

            return response()->json([
                'message' => 'Producto creado exitosamente.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el producto: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Product $product)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['duenio', 'super-admin', 'admin', 'supervisor'])) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:255|unique:' . $product->getTable() . ',code,' . $product->id,
                'price' => 'required|numeric|min:0',
                'quantity' => 'required|integer|min:0',
            ]);

            $product->update($request->only(['name', 'code', 'price', 'quantity']));

            return response()->json([
                'message' => 'Producto actualizado exitosamente.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el producto: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Product $product)
    {
        $user = auth()->user();
        if (!$user->hasAnyRole(['duenio', 'super-admin', 'admin', 'supervisor'])) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        try {
            $product->delete();

            return response()->json([
                'message' => 'Producto eliminado exitosamente.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el producto: ' . $e->getMessage()
            ], 500);
        }
    }
}
