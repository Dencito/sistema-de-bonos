<?php

namespace App\Http\Controllers\FingerprintLogs;

use App\Http\Controllers\Controller;
use App\Models\FingerprintLog;
use App\Models\Totem;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FingerprintLogController extends Controller
{
    public function index()
    {
        $fingerprintLogs = FingerprintLog::with([
            'user' => function ($query) {
                $query->select('id', 'first_name', 'second_name', 'first_last_name', 'second_last_name', 'email', 'role_id', 'branch_id', 'status_id');
            },
            'totem',
            'totem.branch',
            'user.role'
        ])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('FingerprintLogs/index', [
            'fingerprintLogs' => $fingerprintLogs
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
