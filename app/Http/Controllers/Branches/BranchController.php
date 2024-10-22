<?php

namespace App\Http\Controllers\Branches;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Branch;
use App\Models\Company;
use App\Models\State;
use App\Models\Shift;
use App\Models\ShiftSchedule;
use App\Models\AvailableBonusDay; //shifts available bonus
use App\Models\AvailableBonusSchedule; //schedules to available bonus


use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Mail\BranchCreatedMail;
use Illuminate\Support\Facades\Mail;
//use App\Events\UpdateBranchEvent;


use Inertia\Inertia;

class BranchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        
        //UpdateBranchEvent::dispatch('Hello World! I am an event 😄');
        //event(new UpdateBranchEvent('Hello World! I am an event 😄'));
        
        if (!auth()->user()->hasAnyRole(1, 2, 3)) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }
        
        $companySelectSession = $request->session()->get('selected_company');
        
        if (auth()->user()->hasAnyRole(3, 4, 5)) {
            $request->company = $companySelectSession;
        }
        $companies = Company::all()->map(function($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
            ];
        });
        $states = State::all();
        
        if ($companies->isEmpty()) {
            abort(403, 'No tienes permiso para acceder a esta página. Debe existir al menos una empresa.');
        }
        $branches = Branch::with(['shifts', 'users', 'shifts.schedules', 'availableBonusDays.schedules', 'state', 'company'])
        ->when($request->name, function ($query, $name) {
            $query->where('name', 'like', "%{$name}%");
        })
        ->when($request->state, function ($query, $state) {
            $query->whereHas('state', function ($q) use ($state) {
                $q->where('name', $state);
            });
        })
        ->get();

        
        
        $data = [
            'companies' => $companies,
            'states' => $states,
            'branches' => $branches,
            'total' => $branches->count(),
            'filters' => $request->only(['name', 'state'])
        ];
        return Inertia::render('Branches/Index', $data);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
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
                'state_id' => 3,
            ]);
    
            // Crear los turnos y horarios
            foreach ($request->shifts as $shiftData) {
                $shift = $branch->shifts()->create([
                    'day_init' => $shiftData['day_init'],
                    'day_end' => $shiftData['day_end'],
                ]);
            
                foreach ($shiftData['schedule'] as $schedule) {
                    $shift->schedules()->create([
                        'start' => $schedule['start'],
                        'end' => $schedule['end'],
                    ]);
                }
            }

            // Crear los turnos y horarios
            foreach ($request->availableBonusDays as $availableBonusDayData) {
                $availableBonusDay = $branch->availableBonusDays()->create([
                    'day' => $availableBonusDayData['day'],
                ]);
            
                foreach ($availableBonusDayData['schedule'] as $schedule) {
                    $availableBonusDay->schedules()->create([
                        'start' => $schedule['start'],
                        'end' => $schedule['end'],
                    ]);
                }
            }
    
            Mail::to(env('MAIL_TO_SEND'))
            ->send(new BranchCreatedMail($branch, Company::find($branch->company_id)->name, auth()->user()->username));

            return response()->json(['message' => 'Sucursal creada exitosamente'], 201);
        }
    }

    public function getBranchByName($name) {
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
            'id' => 'required|exists:branches,id',
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
            'state_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
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

        if (!auth()->user()->hasAnyRole(1) && ($branch->state_id !== $request->state_id)) {
            abort(403, 'No tienes permiso para cambiar el estado.');
        }

        if (!auth()->user()->hasAnyRole(1) && ($branch->company_id !== $request->company_id)) {
            abort(403, 'No tienes permiso para cambiar la empresa');
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
            'state_id',
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
        //$branch->shifts()->whereNotIn('id', $requestShiftIds)->delete();

        return response()->json(['message' => 'Turnos actualizados exitosamente.', 'sendData' => $request->shifts, 'data' => $branch], 200);
    }

    public function updateShiftsAvailableBonusDays(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        $branch = Branch::findOrFail($request->branch_id);

        // IDs de turnos que vienen en la solicitud
        $requestShiftIds = collect($request->available_bonus_days)->pluck('id')->filter();
        // Actualizar o crear turnos
        foreach ($request->available_bonus_days as $index => $shiftData) {
            if (isset($shiftData['id'])) {
                $shift = AvailableBonusDay::find($shiftData['id']);
                if (!$shift) {
                    return response()->json(['message' => 'El turno ' . ($index + 1) . ' no fue encontrado o se encuentra borrado. Por favor, refresque la ventana.'], 404);
                }
                // Actualizar turno existente
                $shift = $branch->availableBonusDays()->findOrFail($shiftData['id']);
                $shift->update([
                    'day' => $shiftData['day'],
                ]);
            } else {

               $shift = $branch->availableBonusDays()->create([
                   'day' => $shiftData['day'],
                ]);
                
                foreach ($shiftData['schedules'] as $schedule) {
                    $shift->schedules()->create([
                        'start' => $schedule['start'],
                        'end' => $schedule['end'],
                    ]);
                }
                
                $shiftFound = $branch->availableBonusDays()->with('schedules')->findOrFail($shift->id);
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
        //$branch->shifts()->whereNotIn('id', $requestShiftIds)->delete();

        return response()->json(['message' => 'Turnos actualizados exitosamente.', 'sendData' => $request->shifts, 'data' => $branch], 200);
    }

    public function deleteShift(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        $shift = Shift::find($request->id);

        if (!$shift) {
            return response()->json(['message' => 'El turno no fue encontrado o se encuentra borrado. Por favor, refresque la ventana.'], 404);
        }

        // Obtener la sucursal a la que pertenece el turno
        $branch = $shift->branch;

        // Verificar si la sucursal tiene más de un turno
        if ($branch->shifts()->count() <= 1) {
            return response()->json(['message' => 'No se puede eliminar el turno porque la sucursal solo tiene un turno.'], 400);
        }

        // Eliminar el turno
        $shift->delete();

        return response()->json(['message' => 'Turno eliminado exitosamente.'], 200);
    } 

    public function deleteShiftAvailableBonusDays(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        $shift = AvailableBonusDay::find($request->id);

        if (!$shift) {
            return response()->json(['message' => 'El turno no fue encontrado o se encuentra borrado. Por favor, refresque la ventana.'], 404);
        }

        // Obtener la sucursal a la que pertenece el turno
        $branch = $shift->branch;

        // Verificar si la sucursal tiene más de un turno
        if ($branch->availableBonusDays()->count() <= 1) {
            return response()->json(['message' => 'No se puede eliminar el turno de los bonos porque la sucursal solo tiene uno.'], 400);
        }

        // Eliminar el turno
        $shift->delete();

        return response()->json(['message' => 'Turno eliminado exitosamente.'], 200);
    } 

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        
        $branch = Branch::find($request->id);

        if (!$branch) {
            return response()->json(['message' => 'La sucursal no existe o ya fue eliminada', 'error' => true], 400);
        }
        //broadcast(new UpdateBranchEvent($branch, auth()->user()))->toOthers();

        $branch->delete();


        return response()->json([
            'error' => false,
            'message' => 'La sucursal ha sido eliminada exitosamente',
        ]);

    }
}
