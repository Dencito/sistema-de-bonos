<?php

namespace App\Http\Controllers\Companies;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Role;
use App\Models\Status;
use App\Services\CompanyDatabaseService;
use App\Services\CpanelService;
use App\Services\GoDaddyService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Report;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CompanyController extends Controller
{
    private $baseDirectory = 'companies';
    private $excludedDirs = ['deploy'];
    protected $godaddyService;
    protected $cpanelService;
    protected $companyDatabaseService;

    public function __construct(GoDaddyService $godaddyService, CpanelService $cpanelService, CompanyDatabaseService $companyDatabaseService)
    {
        $this->godaddyService = $godaddyService;
        $this->cpanelService = $cpanelService;
        $this->companyDatabaseService = $companyDatabaseService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            if (!auth()->user()->hasAnyRole(1, 2)) {
                abort(403, 'No tienes permiso para acceder a esta página.');
            }

            $companySelectSession = $request->session()->get('selected_company');

            if (auth()->user()->hasAnyRole(2)) {
                $request->name = $companySelectSession;
            }

            $companies = Company::with(['branches', 'status'])
                ->when($request->name, function ($query, $name) {
                    $query->where('name', 'like', "%{$name}%");
                })
                ->when($request->status, function ($query, $status) {
                    $query->whereHas('status', function ($q) use ($status) {
                        $q->where('name', $status);
                    });
                })
                ->get();

            $roles = Role::all();
            $statuses = Status::where('name', '!=', 'En revisión')->get();

            $data = [
                'companies' => $companies,
                'roles' => $roles,
                'statuses' => $statuses,
                'total' => $companies->count(),
                'filters' => $request->only(['name', 'status'])
            ];

            return Inertia::render('Companies/index', $data);
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.index', [
                'filters' => $request->only(['name', 'status'])
            ]);
            throw $e;
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        // Eliminar el límite de tiempo para esta operación pesada
        set_time_limit(0);
        
        $company = null;
        $directoryCreated = false;
        $godaddySubdomainCreated = false;
        $cpanelSubdomainCreated = false;
        $tablesCreated = false;
        $slug = null;

        try {
            if (!auth()->user()->hasAnyRole(1)) {
                abort(403, 'No tienes permiso para acceder a esta página.');
            }

            $validator = Validator::make($request->all(), [
                'creationDate' => 'required|date',
                'db_name' => 'string',
                'name' => 'required|string',
                'slug' => 'required|string',
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

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error en la validación de los datos',
                    'errors' => $validator->errors(),
                    'status' => 400
                ], 400);
            }

            // Verificar si ya existe una empresa con el mismo nombre
            $existingCompany = $this->getCompanyByName($request->name);
            if ($existingCompany) {
                return response()->json([
                    'message' => 'Ya existe una empresa con este nombre',
                    'status' => 400
                ], 400);
            }

            // Verificar si ya existe una empresa con el mismo RUT
            $existingRut = $this->getRutByRutNumbers($request->rutNumbers);
            if ($existingRut) {
                return response()->json([
                    'message' => 'Ya existe una empresa con este RUT',
                    'status' => 400
                ], 400);
            }

            // Preparar los datos de la empresa
            $data = $request->all();
            $slug = Str::slug($request->slug);

            $data['status_id'] = 1;
            $data['schema_name'] = $slug;  // Usar el mismo slug como schema_name
            $data['settings'] = json_encode([]);  // Agregar settings vacío
            $data['is_active'] = true;  // Activar la empresa por defecto

            DB::beginTransaction();
            try {
                // Paso 1: Crear registro en la base de datos
                $company = Company::create($data);
                
                // Paso 2: Crear directorio de la empresa
                $domain = $this->createCompanyDirectory($company);
                $directoryCreated = true;

                // Paso 3: Si estamos en producción, crear subdominios
                if (env("APP_ENV") === "prod") {
                    // Crear subdominios en GoDaddy
                    $this->godaddyService->createSubdomain($slug);
                    $godaddySubdomainCreated = true;
                    
                    // Crear subdominios en cPanel
                    $this->cpanelService->createSubdomain($slug);
                    $cpanelSubdomainCreated = true;
                }
                
                // Paso 4: Crear tablas de la empresa
                $this->companyDatabaseService->createCompanyTables($request);
                $tablesCreated = true;
                
                // Si todo salió bien, confirmar la transacción
                DB::commit();
                
                return response()->json([
                    'message' => 'Empresa creada exitosamente',
                    'company' => $company,
                ], 201);
            } catch (\Exception $e) {
                // Revertir la transacción
                DB::rollBack();
                throw $e;
            }
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.create', [
                'company_data' => $request->only(['name', 'rut', 'email'])
            ]);
            
            // Realizar rollback manual de los recursos creados
            $this->rollbackCompanyCreation($company, $slug, $directoryCreated, $godaddySubdomainCreated, $cpanelSubdomainCreated, $tablesCreated);
            
            return response()->json([
                'message' => 'Error al crear la empresa: ' . $e->getMessage(),
                'status' => 500
            ], 500);
        }
    }
    
    /**
     * Rollback de la creación de una empresa si algo falla
     */
    private function rollbackCompanyCreation($company, $slug, $directoryCreated, $godaddySubdomainCreated, $cpanelSubdomainCreated, $tablesCreated)
    {
        try {
            \Log::info('Iniciando rollback de creación de empresa');
            
            // 1. Eliminar tablas si fueron creadas
            if ($tablesCreated && $slug) {
                try {
                    \Log::info('Eliminando tablas creadas para la empresa: ' . $slug);
                    $this->dropCompanyTables($slug);
                } catch (\Exception $e) {
                    \Log::warning('Error al eliminar tablas durante rollback: ' . $e->getMessage());
                }
            }
            
            // 2. Eliminar subdominio en cPanel si fue creado
            if ($cpanelSubdomainCreated && $slug) {
                try {
                    \Log::info('Eliminando subdominio en cPanel: ' . $slug);
                    $this->deleteSubdomainFromCpanel($slug);
                } catch (\Exception $e) {
                    \Log::warning('Error al eliminar subdominio cPanel durante rollback: ' . $e->getMessage());
                }
            }
            
            // 3. Eliminar subdominio en GoDaddy si fue creado
            if ($godaddySubdomainCreated && $slug) {
                try {
                    \Log::info('Eliminando subdominio en GoDaddy: ' . $slug);
                    $this->deleteSubdomainFromGoDaddy($slug);
                } catch (\Exception $e) {
                    \Log::warning('Error al eliminar subdominio GoDaddy durante rollback: ' . $e->getMessage());
                }
            }
            
            // 4. Eliminar el directorio si fue creado
            if ($directoryCreated && $company && $company->domain) {
                try {
                    \Log::info('Eliminando directorio: ' . $company->domain);
                    $this->deleteCompanyDirectory($company);
                } catch (\Exception $e) {
                    \Log::warning('Error al eliminar directorio durante rollback: ' . $e->getMessage());
                }
            }
            
            // 5. Eliminar el registro de la empresa en la base de datos
            if ($company && isset($company->id)) {
                try {
                    \Log::info('Eliminando registro de la empresa ID: ' . $company->id);
                    // Usar consulta directa en lugar de métodos de modelo que podrían depender de transacciones
                    DB::table('companies')->where('id', $company->id)->delete();
                } catch (\Exception $e) {
                    \Log::warning('Error al eliminar registro de empresa durante rollback: ' . $e->getMessage());
                }
            }
            
            \Log::info('Rollback completado con éxito');
        } catch (\Throwable $e) {
            \Log::error('Error durante el rollback de creación de empresa: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
        }
    }
    
    /**
     * Eliminar tablas creadas para una empresa
     */
    private function dropCompanyTables($slug)
    {
        try {
            // Desactivar verificación de claves foráneas temporalmente
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            
            // Orden correcto: primero las tablas hijas, luego las padres
            // Este orden debe respetar las dependencias de claves foráneas
            $tablesToDrop = [
                // Tablas que dependen de otras tablas
                $slug . '_fingerprint_logs',     // Depende de users y totems
                $slug . '_tickets',              // Depende de users y totems
                $slug . '_shifts',               // Depende de users y branches
                $slug . '_user_branches',        // Depende de users y branches
                $slug . '_bonuses',              // Depende de users
                $slug . '_totems',               // Depende de branches
                
                // Tablas con dependencias medias
                $slug . '_users',                // Depende de roles, status, branches, companies, category_bonuses
                $slug . '_branches',             // Depende de status y companies
                
                // Tablas con menos dependientes
                $slug . '_category_bonuses',     // Pocos o ningún dependiente
                $slug . '_companies',            // Depende de status
                $slug . '_roles',                // Pocos o ningún dependiente
                $slug . '_statuses',             // Tabla base, eliminar al final
            ];
            
            foreach ($tablesToDrop as $table) {
                if (Schema::hasTable($table)) {
                    try {
                        Schema::drop($table);
                        \Log::info('Tabla eliminada: ' . $table);
                    } catch (\Exception $tableException) {
                        \Log::warning('No se pudo eliminar la tabla {$table}: ' . $tableException->getMessage());
                    }
                }
            }
            
            // Reactivar verificación de claves foráneas
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            
            return true;
        } catch (\Throwable $e) {
            // Asegurarse de reactivar la verificación de claves foráneas incluso en caso de error
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            \Log::error('Error al eliminar tablas: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Eliminar subdominio de cPanel
     */
    private function deleteSubdomainFromCpanel($slug)
    {
        try {
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => "cpanel {$this->cpanelService->getUsername()}:{$this->cpanelService->getToken()}",
                ])->post("{$this->cpanelService->getBaseUrl()}/execute/SubDomain/delsubdomain", [
                    'domain' => $slug,
                    'rootdomain' => env('GODADDY_DOMAIN')
                ]);
                
            if ($response->failed()) {
                \Log::error('Error al eliminar subdominio en cPanel: ' . $response->body());
            }
            
            return true;
        } catch (\Throwable $e) {
            \Log::error('Error al eliminar subdominio de cPanel: ' . $e->getMessage());
        }
    }
    
    /**
     * Eliminar subdominio de GoDaddy
     */
    private function deleteSubdomainFromGoDaddy($slug)
    {
        try {
            $domain = env('GODADDY_DOMAIN') ?: $this->godaddyService->getDomain();
            $baseUrl = $this->godaddyService->getBaseUrl();
            
            \Log::info("Iniciando eliminación de registros DNS para {$slug}.{$domain}");
            
            // Primero obtenemos los registros actuales para validar
            $recordsResponse = Http::withHeaders([
                'Authorization' => "sso-key {$this->godaddyService->getApiKey()}:{$this->godaddyService->getApiSecret()}",
                'Content-Type' => 'application/json',
            ])->withOptions([
                'verify' => false
            ])->get("{$baseUrl}/domains/{$domain}/records");
            
            if ($recordsResponse->successful()) {
                $allRecords = $recordsResponse->json();
                \Log::info("Registros DNS obtenidos. Encontrados: " . count($allRecords));
                
                // Filtrar registros relacionados con este subdominio
                $recordsToDelete = array_filter($allRecords, function($record) use ($slug) {
                    return ($record['name'] === $slug) || 
                           ($record['name'] === "cpanel.{$slug}") || 
                           (strpos($record['name'], "{$slug}.") === 0);
                });
                
                if (count($recordsToDelete) > 0) {
                    \Log::info("Registros a eliminar para {$slug}: " . count($recordsToDelete));
                    
                    // Eliminar cada registro individualmente
                    foreach ($recordsToDelete as $record) {
                        $recordType = $record['type'];
                        $recordName = $record['name'];
                        
                        // La API de GoDaddy requiere usar PUT para actualizar registros (no hay DELETE directo)
                        // Por lo tanto, enviamos un array vacío para ese tipo y nombre
                        $response = Http::withHeaders([
                            'Authorization' => "sso-key {$this->godaddyService->getApiKey()}:{$this->godaddyService->getApiSecret()}",
                            'Content-Type' => 'application/json',
                        ])->withOptions([
                            'verify' => false
                        ])->put("{$baseUrl}/domains/{$domain}/records/{$recordType}/{$recordName}", []);
                        
                        if ($response->successful()) {
                            \Log::info("Registro eliminado: {$recordType} {$recordName}");
                        } else {
                            \Log::warning("Error al eliminar registro {$recordType} {$recordName}: " . $response->body());
                            
                            // Intentar método alternativo - reemplazar con array vacío
                            $response2 = Http::withHeaders([
                                'Authorization' => "sso-key {$this->godaddyService->getApiKey()}:{$this->godaddyService->getApiSecret()}",
                                'Content-Type' => 'application/json',
                            ])->withOptions([
                                'verify' => false
                            ])->put("{$baseUrl}/domains/{$domain}/records/{$recordType}", [[
                                'data' => '',
                                'name' => $recordName,
                                'ttl' => 3600,
                                'type' => $recordType
                            ]]);
                            
                            if ($response2->successful()) {
                                \Log::info("Registro {$recordType} {$recordName} reemplazado con vacío");
                            } else {
                                \Log::warning("No se pudo reemplazar el registro {$recordType} {$recordName}: " . $response2->body());
                            }
                        }
                    }
                } else {
                    \Log::info("No se encontraron registros DNS para eliminar relacionados con {$slug}");
                }
            } else {
                \Log::error("Error al obtener registros DNS: " . $recordsResponse->body());
            }
            
            return true;
        } catch (\Throwable $e) {
            \Log::error('Error al eliminar subdominio de GoDaddy: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
        }
    }
    
    /**
     * Eliminar directorio de la empresa
     */
    private function deleteCompanyDirectory(Company $company)
    {
        try {
            if (!$company->domain) {
                return false;
            }
            
            $sourceDir = base_path();
            $parentDir = dirname($sourceDir);
            $targetDir = $parentDir . DIRECTORY_SEPARATOR . $company->domain;
            
            if (File::exists($targetDir)) {
                File::deleteDirectory($targetDir);
                return true;
            }
            
            return false;
        } catch (\Throwable $e) {
            \Log::error('Error al eliminar directorio de la empresa: ' . $e->getMessage());
        }
    }

    private function createCompanyDirectory(Company $company)
    {
        $domain = env('GODADDY_DOMAIN');
        $slug = $company->slug;
        $domain = "{$slug}.{$domain}";
        $company->domain = $domain;
        $company->save();
        
        if(env("APP_ENV") === "local") {
            return $domain;
        }
        $sourceDir = base_path();
        $parentDir = dirname($sourceDir);  // Subir un nivel: /carpetaPadre
        $targetDir = $parentDir . DIRECTORY_SEPARATOR . $domain;

        try {
            if (!File::exists($sourceDir)) {
                throw new \Exception("El directorio fuente no existe: {$sourceDir}");
            }

            if (File::exists($targetDir)) {
                throw new \Exception("El directorio para {$domain} ya existe");
            }

            File::makeDirectory($targetDir, 0755, true);

            $this->copyDirectoryContents($sourceDir, $targetDir);

            $this->configureEnvFile($targetDir, $company);

            return $domain;
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.createCompanyDirectory', [
                'company_id' => $company->id,
                'domain' => $domain
            ]);
            if (File::exists($targetDir)) {
                File::deleteDirectory($targetDir);
            }
            throw $e;
        }
    }

    private function copyDirectoryContents($source, $destination)
    {
        if (!File::exists($destination)) {
            File::makeDirectory($destination, 0755, true);
        }

        $directory = new \RecursiveDirectoryIterator($source, \RecursiveDirectoryIterator::SKIP_DOTS);
        $iterator = new \RecursiveIteratorIterator($directory, \RecursiveIteratorIterator::SELF_FIRST);

        foreach ($iterator as $item) {
            $relativePath = substr($item->getPathname(), strlen($source) + 1);

            if ($item->isDir()) {
                $targetDir = $destination . DIRECTORY_SEPARATOR . $relativePath;
                if (!File::exists($targetDir)) {
                    File::makeDirectory($targetDir, 0755, true);
                }
            } else {
                $targetFile = $destination . DIRECTORY_SEPARATOR . $relativePath;
                File::copy($item->getPathname(), $targetFile);
            }
        }

        $dirsToCreate = [
            'storage/app',
            'storage/framework/cache',
            'storage/framework/sessions',
            'storage/framework/views',
            'storage/logs',
            'bootstrap/cache'
        ];

        foreach ($dirsToCreate as $dir) {
            $path = $destination . DIRECTORY_SEPARATOR . $dir;
            if (!File::exists($path)) {
                File::makeDirectory($path, 0755, true);
            }
        }
    }

    private function configureEnvFile($targetDir, Company $company)
    {
        $envFile = $targetDir . DIRECTORY_SEPARATOR . '.env';

        if (!File::exists($envFile)) {
            throw new \Exception('No se encontró el archivo .env en el directorio destino');
        }

        $envContent = File::get($envFile);

        $replacements = [
            // 'DB_DATABASE' => 'tenant_' . $company->slug,
            'APP_URL' => 'https://' . $company->domain,
            'SESSION_DOMAIN' => $company->domain,
            'APP_PRIMARY_SUBDOMAIN' => $company->name,
            'SANCTUM_STATEFUL_DOMAINS' => $company->domain
        ];

        foreach ($replacements as $key => $value) {
            $envContent = preg_replace(
                "/^{$key}=.*/m",
                "{$key}={$value}",
                $envContent
            );
        }

        // Guardar el nuevo .env
        File::put($envFile, $envContent);

        // Generar key
        $command = "cd {$targetDir} && php artisan key:generate && npm install -f && npm run build";
        exec($command);
    }

    public function getCompanyByName($name)
    {
        return Company::where('name', $name)->first();
    }

    public function getRutByRutNumbers($rutNumbers)
    {
        return Company::where('rutNumbers', $rutNumbers)->first();
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
        try {
            $companies = Company::all()->map(function ($company) {
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
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.show', [
                'company_id' => $id
            ]);
            throw $e;
        }
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
        try {
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
                // throw $th;
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
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.update', [
                'company_id' => $request->input('id'),
                'company_data' => $request->only(['name', 'rut', 'email'])
            ]);
            throw $e;
        }
    }

    public function destroy(Request $request)
    {
        // Eliminar el límite de tiempo para esta operación pesada
        set_time_limit(0);
        
        try {
            if (!auth()->user()->hasAnyRole(1)) {
                abort(403, 'No tienes permiso para realizar esta acción.');
            }
            
            $company = Company::find($request->id);

            if (!$company) {
                return response()->json(['message' => 'La empresa no existe', 'error' => true], 400);
            }
            
            // Guardar información relevante antes de eliminar
            $slug = $company->slug;
            $domain = $company->domain;
            
            // Ya no usamos transacciones aquí porque dropCompanyTables maneja su propia transacción
            // y puede desactivar las restricciones de claves foráneas
            
            try {
                // 1. Eliminar tablas de la empresa
                $this->dropCompanyTables($slug);
                
                // 2. Si estamos en producción, eliminar subdominios
                if (env("APP_ENV") === "prod") {
                    // Eliminar subdominio en cPanel
                    $this->deleteSubdomainFromCpanel($slug);
                    
                    // Eliminar subdominio en GoDaddy
                    $this->deleteSubdomainFromGoDaddy($slug);
                }
                
                // 3. Eliminar el directorio de la empresa
                $this->deleteCompanyDirectory($company);
                
                // 4. Eliminar el registro de la empresa en la base de datos
                $company->delete();
                
                return response()->json([
                    'error' => false,
                    'message' => 'La empresa ha sido eliminada exitosamente',
                ]);
            } catch (\Throwable $e) {
                // Capturar y registrar el error pero no lanzarlo de nuevo
                \Log::error('Error en proceso de eliminación de empresa: ' . $e->getMessage());
                \Log::error($e->getTraceAsString());
                
                // Intenta continuar con la eliminación de la empresa en la base de datos
                if ($company->exists) {
                    try {
                        $company->delete();
                        \Log::info('Se eliminó el registro de la empresa a pesar de otros errores');
                    } catch (\Exception $deleteException) {
                        \Log::error('No se pudo eliminar el registro de la empresa: ' . $deleteException->getMessage());
                    }
                }
                
                // Re-lanzar la excepción para manejarla en el catch exterior
                throw $e;
            }
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.destroy', [
                'company_id' => $request->input('id')
            ]);
            return response()->json([
                'error' => true,
                'message' => 'Error al eliminar la empresa: ' . $e->getMessage(),
                'status' => 500
            ], 500);
        }
    }

    // Verificar si la empresa existe
    public function verifyCompany(Request $request)
    {
        try {
            $companyName = $request->query('name');

            if (!$companyName) {
                return response()->json(['error' => 'El nombre de la empresa es requerido.'], 400);
            }

            $companyExists = Company::where('name', $companyName)->exists();

            return response()->json(['exists' => $companyExists]);
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.verifyCompany', [
                'company_name' => $request->query('name')
            ]);
            throw $e;
        }
    }

    // Seleccionar una empresa y almacenarla en la sesión
    public function selectCompany(Request $request)
    {
        try {
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
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.selectCompany', [
                'company_name' => $request->input('name')
            ]);
            throw $e;
        }
    }

    public function deselectCompany(Request $request)
    {
        try {
            // Elimina la empresa seleccionada de la sesión
            $request->session()->forget('selected_company');

            // Responde con éxito
            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.deselectCompany');
            return response()->json(['error' => 'Error al deseleccionar la empresa'], 500);
        }
    }

    public function updateEnv(Request $request)
    {
        try {
            // Buscar la empresa por su ID
            $company = Company::find($request->id);

            if (!$company) {
                return response()->json(['message' => 'La empresa no existe', 'error' => true], 400);
            }

            // Cambiar el valor de la variable de entorno DB_DATABASE
            $this->setEnvValue('DB_DATABASE', $company->db_name);

            return response()->json(['message' => 'Se cambio exitosamente de aplicación.'], 200);
        } catch (\Throwable $e) {
            $this->logError($e, 'companies.updateEnv', [
                'company_id' => $request->input('id')
            ]);
            throw $e;
        }
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

    protected function logError(\Throwable $exception, string $context = '', array $extraData = [])
    {
        report($exception);
    }
}
