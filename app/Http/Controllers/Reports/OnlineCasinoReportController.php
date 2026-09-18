<?php

namespace App\Http\Controllers\Reports;

use App\Constants\BankAccess;
use App\Http\Controllers\Controller;
use App\Services\MiadminReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Reporte de casinos online: lo que movieron las cuentas en miadmin.cc.
 *
 * Es solo lectura: no escribe nada, ni acá ni allá.
 */
class OnlineCasinoReportController extends Controller
{
    public function __construct(private MiadminReportService $miadmin)
    {
    }

    private function autorizado(): bool
    {
        return BankAccess::allows(Auth::user());
    }

    public function index()
    {
        if (!$this->autorizado()) {
            abort(403, 'No tenés permiso para ver el reporte de casinos online');
        }

        [$desde, $hasta] = MiadminReportService::rangoPorDefecto();

        return Inertia::render('OnlineCasinos/Index', [
            'defaultRange' => [$desde, $hasta],
            'configured' => $this->miadmin->configurado(),
        ]);
    }

    public function report(Request $request)
    {
        if (!$this->autorizado()) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $datos = $request->validate([
            'start' => 'required|date',
            'end' => 'required|date|after_or_equal:start',
        ]);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->miadmin->resumen(
                    substr($datos['start'], 0, 10),
                    substr($datos['end'], 0, 10)
                ),
            ]);
        } catch (\RuntimeException $e) {
            // El mensaje del service ya está escrito para que lo lea una persona
            return response()->json(['success' => false, 'message' => $e->getMessage()], 502);
        }
    }
}
