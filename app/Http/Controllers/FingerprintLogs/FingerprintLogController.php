<?php

namespace App\Http\Controllers\FingerprintLogs;

use App\Models\FingerprintLog;
use App\Models\User;
use App\Models\Totem;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class FingerprintLogController extends Controller
{
    public function index()
    {
        $fingerprintLogs = FingerprintLog::with(['user', 'totem', 'totem.branch'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        $users = User::all();
        $totems = Totem::with('branch')->get();
        
        return Inertia::render('FingerprintLogs/index', [
            'fingerprintLogs' => $fingerprintLogs,
            'users' => $users,
            'totems' => $totems
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'totem_id' => 'required|exists:totems,id',
        ]);

        return FingerprintLog::create($validated);
    }

    public function show(FingerprintLog $fingerprintLog)
    {
        return $fingerprintLog->load(['user', 'totem', 'totem.branch']);
    }

    public function update(Request $request, FingerprintLog $fingerprintLog)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'totem_id' => 'required|exists:totems,id',
        ]);

        $fingerprintLog->update($validated);
        return $fingerprintLog;
    }

    public function destroy(FingerprintLog $fingerprintLog)
    {
        $fingerprintLog->delete();
        return response()->noContent();
    }
}
