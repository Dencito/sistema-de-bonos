<?php

namespace App\Http\Controllers\Companies;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\State;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;


class CompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        if (!auth()->user()->hasAnyRole(1, 2)) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }

        $companySelectSession = $request->session()->get('selected_company');
        
        if (auth()->user()->hasAnyRole(2)) {
            $request->name = $companySelectSession;
        }

        $companies = Company::with(['branches','state'])
            ->when($request->name, function ($query, $name) {
                $query->where('name', 'like', "%{$name}%");
            })
            ->when($request->state, function ($query, $state) {
                $query->whereHas('state', function ($q) use ($state) {
                    $q->where('name', $state);
                });
            })
            ->get();

        $states = State::where('name', '!=', 'En revisión')->get();

        $data = [
            'companies' => $companies,
            'states' => $states,
            'total' => $companies->count(),
            'filters' => $request->only(['name', 'state'])
        ];

        return Inertia::render('Companies/Index', $data);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1)) {
            abort(403, 'No tienes permiso para acceder a esta página.');
        }
        $validator = Validator::make($request->all(), [
            'creationDate' => 'required|date',
            'db_name' => 'string',
            'name' => 'required|string',
            'rutNumbers' => 'required|string',
            'rutDv' => 'required|string',
            'business' => 'required|string',
            'prefix' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email',
            'legalRepresentativeNames' => 'required|string',
            'legalRepresentativeLastNames' => 'required|string',
            'rutNumbersLegalRepresentative' => 'required|string',
            'rutDvLegalRepresentative' => 'required|string',
            'contactNames' => 'required|string',
            'contactLastNames' => 'required|string',
            'rutNumbersContact' => 'required|string',
            'rutDvContact' => 'required|string',
            'prefixContact' => 'required|string',
            'contactPhone' => 'required|string',
            'contactEmail' => 'required|email',
            'companyAddressCountry' => 'required|string',
            'companyAddressRegion' => 'required|string',
            'companyAddressProvince' => 'required|string',
            'companyAddressCommune' => 'required|string',
            'companyAddressStreet' => 'required|string',
            'companyAddressNumber' => 'required|string',
            'max_branches' => 'required|string',
        ]);
        /* return response()->json([
            'data' => $foundRut,
            'rutNumbers' => $request->rutNumbers
            ]); */
            
                try {
                    $found = $this->getCompanyByName($request->name);
                    if ($found) {
                        return response()->json([
                            'message' => 'La empresa ya existe',
                            'status' => 400
                        ], 400);
                    }
                } catch (ModelNotFoundException $e) {
                    // Handle the case when the company is not found, which means it's safe to create a new one
                }
        
                try {
                    $foundRut = $this->getRutByRutNumbers($request->rutNumbers);
                    if ($foundRut) {
                        return response()->json([
                            'message' => 'El rut de la empresa ya existe',
                            'status' => 400
                        ], 400);
                    }
                } catch (ModelNotFoundException $e) {
                    // Handle the case when the rut is not found, which means it's safe to create a new one
                }
            if ($validator->fails()) {
                $data = [
                    'message' => 'Error en la validación de los datos',
                    'errors' => $validator->errors(),
                    'status' => 400
                ];
                return response()->json($data, 400);
            }

            $company = Company::create(
                array_merge($validator->validated(), 
                ['state_id' => 1]));
            if(!$company) {
                $data = [
                    'message' => 'Error la crear la empresa',
                    'status' => 500,
                ];
                return response()->json($data, 500);
            }

            return response()->json([
                'error' => false,
                'message' => 'Empresa creada exitosamente',
            ]);

    }

    public function getCompanyByName($name) {
        $company = Company::where('name', $name)->firstOrFail();
        return $company;
    }

    public function getRutByRutNumbers($rutNumbers) {
        $company = Company::where('rutNumbers', $rutNumbers)->firstOrFail();
        return $company;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $companies = Company::all()->map(function($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
            ];
        });
        dd($companies);

        return response()->json([
            'error' => false,
            'companies' => $companies
        ]);
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        // Obtener la empresa existente
        $company = Company::find($request->id);

        try {
            if (!$company) {
                return response()->json(['message' => 'No existe la empresa o fue eliminada', 'error' => true], 404);
            }
        } catch (\Throwable $th) {
            //throw $th;
        }

        try {
            $existingCompany = Company::where('name', $request->name)
                               ->where('id', '!=', $request->id)
                               ->first();
            if ($existingCompany) {
                return response()->json(['message' => 'El nombre de la empresa ya existe', 'error' => true], 400);
            }
        } catch (\Throwable $th) {
        }

        $newData = $request->all();

        $oldData = $company->toArray();

        $changes = [];
        foreach ($newData as $key => $value) {
            if (array_key_exists($key, $oldData) && $oldData[$key] != $value) {
                $changes[$key] = [
                    'old' => $oldData[$key],
                    'new' => $value
                ];
            }
        }

        $company->update($newData);

        $companies = Company::all();

        return response()->json([
            'error' => false,
            'message' => 'Empresa actualizada',
            'changes' => $changes
        ]);
    }

    public function destroy(Request $request)
    {
        if (!auth()->user()->hasAnyRole(1)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }
        $company = Company::find($request->id);

        if (!$company) {
            return response()->json(['message' => 'La empresa no existe', 'error' => true], 400);
        }

        $company->delete();

        return response()->json([
            'error' => false,
            'message' => 'La empresa ha sido eliminada exitosamente',
        ]);
    }


    // Verificar si la empresa existe
    public function verifyCompany(Request $request)
    {
        $companyName = $request->query('name');

        if (!$companyName) {
            return response()->json(['error' => 'El nombre de la empresa es requerido.'], 400);
        }

        $companyExists = Company::where('name', $companyName)->exists();

        return response()->json(['exists' => $companyExists]);
    }

    // Seleccionar una empresa y almacenarla en la sesión
    public function selectCompany(Request $request)
    {
        $companyName = $request->input('name');

        if (!$companyName) {
            return response()->json(['error' => 'El nombre de la empresa es requerido.'], 400);
        }

        $company = Company::where('name', $companyName)->first();

        if (!$company) {
            return response()->json(['error' => 'La empresa no existe.'], 404);
        }

        // Almacenar el ID de la empresa en la sesión
        session(['selected_company' => $company->id]);

        return response()->json(['success' => true]);
    }

    public function deselectCompany(Request $request)
    {
        try {
            // Elimina la empresa seleccionada de la sesión
            $request->session()->forget('selected_company');

            // Responde con éxito
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            // Manejo de errores
            return response()->json(['error' => 'Error al deseleccionar la empresa'], 500);
        }
    }

    public function updateEnv(Request $request)
    {
        // Buscar la empresa por su ID
        $company = Company::find($request->id);

        if (!$company) {
            return response()->json(['message' => 'La empresa no existe', 'error' => true], 400);
        }

        // Cambiar el valor de la variable de entorno DB_DATABASE
        $this->setEnvValue('DB_DATABASE', $company->db_name);

        return response()->json(['message' => 'Se cambio exitosamente de aplicación.'], 200);
    }

    private function setEnvValue($key, $value)
    {
        $envFile = base_path('.env');

        if (File::exists($envFile)) {
            // Lee el contenido del archivo .env
            $envContent = File::get($envFile);

            // Busca la variable que quieres cambiar
            $pattern = "/^{$key}=.*/m";

            // Si la variable existe, la reemplaza. Si no existe, la agrega.
            if (preg_match($pattern, $envContent)) {
                $envContent = preg_replace($pattern, "{$key}={$value}", $envContent);
            } else {
                $envContent .= "\n{$key}={$value}";
            }

            // Guarda el nuevo contenido en el archivo .env
            File::put($envFile, $envContent);

            // Opcional: refresca la configuración de Laravel
            Artisan::call('config:clear');
            Artisan::call('config:cache');
        }
    }
}
