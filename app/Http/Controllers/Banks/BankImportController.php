<?php

namespace App\Http\Controllers\Banks;

use App\Constants\BankAccess;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\BankSheetImporter;
use App\Services\BankStore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Subida de la planilla de bancos.
 *
 * Siempre en dos pasos: primero se previsualiza (no escribe nada) y recien
 * despues se confirma. Asi los problemas de la planilla — filas sin fecha, sin
 * ID, clientes nuevos que se parecen a otros — se ven antes de importar.
 */
class BankImportController extends Controller
{
    public function __construct(private BankStore $store)
    {
    }

    private function autorizado(): bool
    {
        return BankAccess::allows(Auth::user());
    }

    private function sinPermiso()
    {
        return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
    }

    private function validarArchivo(Request $request): void
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ], [], ['file' => 'planilla']);
    }

    public function preview(Request $request, BankSheetImporter $importer)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $this->validarArchivo($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $importer->preview($request->file('file')->getRealPath()),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Preview de planilla de bancos falló', ['error' => $e->getMessage()]);

            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function store(Request $request, BankSheetImporter $importer)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $this->validarArchivo($request);

        try {
            $import = $importer->import(
                $request->file('file')->getRealPath(),
                $request->file('file')->getClientOriginalName(),
                Auth::user()
            );
        } catch (\Throwable $e) {
            Log::error('Importación de planilla de bancos falló', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'No se pudo importar: ' . $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => "Se importaron {$import['rows_imported']} movimiento(s) de {$import['rows_total']} fila(s)",
            'data' => $import,
        ]);
    }

    public function index()
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $usuarios = User::get(['id', 'username', 'first_name', 'first_last_name'])->keyBy('id');
        $movs = collect($this->store->all(BankStore::MOVEMENTS))->groupBy('bank_import_id');

        $imports = collect($this->store->all(BankStore::IMPORTS))
            ->sortByDesc('id')
            ->take(50)
            ->map(function ($i) use ($usuarios, $movs) {
                $u = $usuarios->get($i['user_id'] ?? null);

                return array_merge($i, [
                    'movements_count' => $movs->get($i['id'], collect())->count(),
                    'user' => $u ? [
                        'id' => $u->id,
                        'username' => $u->username,
                        'first_name' => $u->first_name,
                        'first_last_name' => $u->first_last_name,
                    ] : null,
                ]);
            })
            ->values();

        return response()->json(['success' => true, 'data' => $imports]);
    }

    /**
     * Deshace una importación entera. Sirve cuando se subió el archivo
     * equivocado o dos veces el mismo.
     */
    public function destroy($id)
    {
        if (!$this->autorizado()) {
            return $this->sinPermiso();
        }

        $import = $this->store->find(BankStore::IMPORTS, $id);

        if (!$import) {
            return response()->json(['success' => false, 'message' => 'Importación no encontrada'], 404);
        }

        $borrados = $this->store->transaction(function () use ($import) {
            $borrados = $this->store->deleteWhere(
                BankStore::MOVEMENTS,
                fn ($m) => (int) ($m['bank_import_id'] ?? 0) === (int) $import['id']
            );

            $this->store->delete(BankStore::IMPORTS, $import['id']);

            return $borrados;
        }, [BankStore::MOVEMENTS, BankStore::IMPORTS]);

        return response()->json([
            'success' => true,
            'message' => "Se deshizo la importación: {$borrados} movimiento(s) eliminados",
        ]);
    }
}
