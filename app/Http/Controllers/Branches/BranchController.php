<?php

namespace App\Http\Controllers\Branches;

use App\Http\Controllers\Controller;
use App\Mail\BranchCreatedMail;
use App\Models\AvailableBonusDay;
use App\Models\AvailableBonusSchedule;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Shift;
use App\Models\ShiftSchedule;
use App\Models\Status;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
// use App\Events\UpdateBranchEvent;
use Inertia\Inertia;

class BranchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // UpdateBranchEvent::dispatch('Hello World! I am an event 😄');
        // event(new UpdateBranchEvent('Hello World! I am an event 😄'));

        if (!auth()->user()->hasAnyRole(1, 2, 3)) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }

        $companySelectSession = $request->session()->get('selected_company');

        if (auth()->user()->hasAnyRole(3, 4, 5)) {
            $request->company = $companySelectSession;
        }
        $companies = Company::all()->map(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
            ];
        });
        $statuses = Status::all();

        if ($companies->isEmpty()) {
            abort(403, 'No tienes permiso para acceder a esta página. Debe existir al menos una empresa.');
        }
        $branches = Branch::with(['shifts', 'users', 'shifts.schedules', 'availableBonusDays.schedules', 'status', 'company'])
            ->when($request->name, function ($query, $name) {
                $query->where('name', 'like', "%{$name}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->whereHas('status', function ($q) use ($status) {
                    $q->where('name', $status);
                });
            })
            ->get();

        $data = [
            'companies' => $companies,
            'statuses' => $statuses,
            'branches' => $branches,
            'total' => $branches->count(),
            'filters' => $request->only(['name', 'status'])
        ];
        return Inertia::render('Branches/index', $data);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        $company = Company::findOrFail($request->company_id);
        $currentBranches = $company->branches()->count();

        if ($currentBranches >= $company->max_branches) {
            return response()->json([
                'message' => 'Se ha alcanzado el número máximo de sucursales. Por favor, comuníquese con un administrador.',
                'status' => 400,
                'error' => true
            ], 400);
        }

        try {
            $found = $this->getBranchByName($request->name);
            if ($found) {
                return response()->json([
                    'message' => 'La sucursal ya existe',
                    'status' => 400
                ], 400);
            }
        } catch (ModelNotFoundException $e) {
            $branch = Branch::create([
                'creationDate' => $request->creationDate,
                'name' => $request->name,
                'numberOfEmployees' => $request->numberOfEmployees,
                'branchAddressCountry' => $request->branchAddressCountry,
                'branchAddressRegion' => $request->branchAddressRegion,
                'branchAddressProvince' => $request->branchAddressProvince,
                'branchAddressCommune' => $request->branchAddressCommune,
                'branchAddressStreet' => $request->branchAddressStreet,
                'branchAddressNumber' => $request->branchAddressNumber,
                'branchAddressLocal' => $request->branchAddressLocal,
                'branchAddressDeptOrHouse' => $request->branchAddressDeptOrHouse,
                'company_id' => $request->company_id,
                'status_id' => 1,
                'available_schedules' => $request->available_schedules,
                'bonus_schedules' => $request->bonus_schedules,
                'birthday_amount' => $request->birthday_amount
            ]);

            return response()->json([
                'message' => 'Sucursal creada exitosamente',
                'data' => $branch,
                'status' => 201
            ], 201);
        }
    }

    /* public function store(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'numberOfEmployees' => 'required|integer',
            'branchAddressCountry' => 'required|string|max:255',
            'branchAddressRegion' => 'required|string|max:255',
            'branchAddressProvince' => 'required|string|max:255',
            'branchAddressCommune' => 'required|string|max:255',
            'branchAddressStreet' => 'required|string|max:255',
            'branchAddressNumber' => 'required|string|max:255',
            'branchAddressLocal' => 'nullable|string|max:255',
            'branchAddressDeptOrHouse' => 'nullable|string|max:255',
            'company_id' => 'required',
            'available_schedules' => 'nullable|json',
            'bonus_schedules' => 'nullable|json',
            'birthday_amount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors(),
                'status' => 422
            ], 422);
        }

        try {
            // Verificar si existe una sucursal con el mismo nombre
            $existingBranch = Branch::where('name', $request->name)->first();
            if ($existingBranch) {
                return response()->json([
                    'message' => 'Ya existe una sucursal con este nombre',
                    'status' => 400
                ], 400);
            }

            // Verificar el límite de sucursales
            $company = Company::findOrFail($request->company_id);
            $currentBranches = $company->branches()->count();

            if ($currentBranches >= $company->max_branches) {
                return response()->json([
                    'message' => 'Se ha alcanzado el número máximo de sucursales permitidas para esta empresa',
                    'status' => 400
                ], 400);
            }

            $branch = Branch::create([
                ...$request->all(),
                'status_id' => 1,
                'creationDate' => now()
            ]);

            return response()->json([
                'message' => 'Sucursal creada exitosamente',
                'data' => $branch,
                'status' => 201
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'No se encontró la empresa especificada',
                'error' => $e->getMessage(),
                'status' => 404
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear la sucursal',
                'error' => $e->getMessage(),
                'status' => 500
            ], 500);
        }
    } */

    public function getBranchByName($name)
    {
        $branch = Branch::where('name', $name)->firstOrFail();
        return $branch;
    }

    public function update(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        // Validar los datos entrantes
        $validator = Validator::make($request->all(), [
            'creationDate' => 'required|date',
            'name' => 'required|string',
            'numberOfEmployees' => 'required|integer',
            'branchAddressCountry' => 'required|string',
            'branchAddressRegion' => 'required|string',
            'branchAddressProvince' => 'required|string',
            'branchAddressCommune' => 'required|string',
            'branchAddressStreet' => 'required|string',
            'branchAddressNumber' => 'required|string',
            'branchAddressLocal' => 'nullable|string',
            'branchAddressDeptOrHouse' => 'nullable|string',
            'status_id' => 'required|integer',
            'available_schedules' => 'nullable|json',
            'bonus_schedules' => 'nullable|json',
            'birthday_amount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'message' => 'Error en la validación de los datos',
                'errors' => $validator->errors(),
                'status' => 400
            ], 400);
        }

        // Obtener la sucursal existente
        $branch = Branch::find($request->id);

        if (!$branch) {
            return response()->json(['message' => 'No existe la sucursal o fue eliminada', 'error' => true], 404);
        }

        // Verificar si el nombre ya existe en otra sucursal
        $existingBranch = Branch::where('name', $request->name)
            ->where('id', '!=', $request->id)
            ->first();

        if ($existingBranch) {
            return response()->json(['message' => 'El nombre de la sucursal ya existe', 'error' => true], 400);
        }

        if (!auth()->user()->hasAnyRole(1,2) && ($branch->status_id !== $request->status_id)) {
            abort(403, 'No tienes permiso para cambiar el estado.');
        }

        if (!auth()->user()->hasAnyRole(1,2) && ($branch->company_id !== $request->company_id)) {
            abort(403, 'No tienes permiso para cambiar la sucursal');
        }

        $oldData = $branch->toArray();
        $newData = $request->only([
            'creationDate',
            'name',
            'numberOfEmployees',
            'branchAddressCountry',
            'branchAddressRegion',
            'branchAddressProvince',
            'branchAddressCommune',
            'branchAddressStreet',
            'branchAddressNumber',
            'branchAddressLocal',
            'branchAddressDeptOrHouse',
            'company_id',
            'status_id',
            'available_schedules',
            'bonus_schedules',
            'birthday_amount'
        ]);

        // Detectar cambios
        $changes = [];
        foreach ($newData as $key => $value) {
            if (array_key_exists($key, $oldData) && $oldData[$key] != $value) {
                $changes[$key] = [
                    'old' => $oldData[$key],
                    'new' => $value
                ];
            }
        }

        // Actualizar la sucursal
        $branch->update($newData);

        return response()->json([
            'error' => false,
            'message' => 'Sucursal actualizada',
            'changes' => $changes
        ]);
    }

    public function updateShifts(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        $branch = Branch::findOrFail($request->branch_id);

        // IDs de turnos que vienen en la solicitud
        $requestShiftIds = collect($request->shifts)->pluck('id')->filter();

        // Actualizar o crear turnos
        foreach ($request->shifts as $index => $shiftData) {
            if (isset($shiftData['id'])) {
                $shift = Shift::find($shiftData['id']);
                if (!$shift) {
                    return response()->json(['message' => 'El turno ' . ($index + 1) . ' no fue encontrado o se encuentra borrado. Por favor, refresque la ventana.'], 404);
                }
                // Actualizar turno existente
                $shift = $branch->shifts()->findOrFail($shiftData['id']);
                $shift->update([
                    'day_init' => $shiftData['day_init'],
                    'day_end' => $shiftData['day_end'],
                ]);
            } else {
                $shift = $branch->shifts()->create([
                    'day_init' => $shiftData['day_init'],
                    'day_end' => $shiftData['day_end'],
                ]);

                foreach ($shiftData['schedules'] as $schedule) {
                    $shift->schedules()->create([
                        'start' => $schedule['start'],
                        'end' => $schedule['end'],
                    ]);
                }

                $shiftFound = $branch->shifts()->with('schedules')->findOrFail($shift->id);
            }

            $existingScheduleIds = [];
            foreach ($shiftData['schedules'] as $scheduleData) {
                if (isset($scheduleData['id'])) {
                    // Actualizar horario existente
                    $schedule = $shift->schedules()->findOrFail($scheduleData['id']);
                    $schedule->update([
                        'start' => $scheduleData['start'],
                        'end' => $scheduleData['end'],
                    ]);
                    $existingScheduleIds[] = $scheduleData['id'];
                } else {
                    // Crear nuevo horario
                    $newSchedule = $shift->schedules()->create([
                        'start' => $scheduleData['start'],
                        'end' => $scheduleData['end'],
                    ]);
                    $existingScheduleIds[] = $newSchedule->id;
                }
            }

            // Eliminar los horarios que no están en la solicitud
            $shift->schedules()->whereNotIn('id', $existingScheduleIds)->delete();
        }

        // Eliminar los turnos que no están en la solicitud
        // $branch->shifts()->whereNotIn('id', $requestShiftIds)->delete();

        return response()->json(['message' => 'Turnos actualizados exitosamente.', 'sendData' => $request->shifts, 'data' => $branch], 200);
    }

    public function destroy(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        $branch = Branch::find($request->id);

        if (!$branch) {
            return response()->json(['message' => 'La sucursal no existe o ya fue eliminada', 'error' => true], 400);
        }
        // broadcast(new UpdateBranchEvent($branch, auth()->user()))->toOthers();

        $branch->delete();

        return response()->json([
            'error' => false,
            'message' => 'La sucursal ha sido eliminada exitosamente',
        ]);
    }
}
