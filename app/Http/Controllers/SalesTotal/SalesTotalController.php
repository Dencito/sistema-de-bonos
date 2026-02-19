<?php

namespace App\Http\Controllers\SalesTotal;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesTotalController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $branchId = $user->branch_id;
        $filterBranchId = $request->input('branch_id');

        // Determinar la sucursal a consultar
        $currentBranchId = $branchId ?: $filterBranchId;

        $salesData = null;
        if ($currentBranchId) {
            $branch = Branch::find($currentBranchId);
            
            if ($branch) {
                // Calcular total de ventas de la sucursal
                $totalSales = Order::where('branch_id', $currentBranchId)->sum('total');
                
                // Obtener acumulador actual y retiros
                $salesAccumulator = $branch->sales_accumulator;
                $withdrawals = $branch->withdrawals ?? [];
                
                // Calcular total de retiros
                $totalWithdrawals = collect($withdrawals)->sum('amount');

                $salesData = [
                    'branch_id' => $branch->id,
                    'branch_name' => $branch->name,
                    'total_sales' => $totalSales,
                    'sales_accumulator' => $salesAccumulator,
                    'total_withdrawals' => $totalWithdrawals,
                    'withdrawals' => $withdrawals,
                    'net_total' => $totalSales - $totalWithdrawals,
                ];
            }
        }

        $branches = Branch::all();

        return Inertia::render('SalesTotal/index', [
            'salesData' => $salesData,
            'branches' => $branches,
            'userHasBranch' => $branchId ? true : false,
        ]);
    }
}
