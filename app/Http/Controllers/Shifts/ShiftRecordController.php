<?php

namespace App\Http\Controllers\Shifts;

use App\Models\ShiftRecord;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ShiftRecordController extends Controller
{

    public function index()
    {
        return ShiftRecord::all();
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required',
            'opened_by_user_id' => 'required',
            'opening_time' => 'required|date',
            'status' => 'nullable'
        ]);
        
        return ShiftRecord::create($validated);
    }

    public function update(Request $request, ShiftRecord $shift)
    {
        $validated = $request->validate([
            'closed_by_user_id' => 'nullable',
            'closing_time' => 'nullable|date',
            'status' => 'sometimes|in:open,closed,pending'
        ]);
        
        $shift->update($validated);
        return $shift;
    }

    public function close(Request $request, ShiftRecord $shift)
    {
        abort_if($shift->status === 'closed', 400, 'El turno ya está cerrado');
        
        $validated = $request->validate([
            'closed_by_user_id' => 'required',
            'closing_time' => 'required|date|after:opening_time'
        ]);
        
        $shift->update(array_merge($validated, ['status' => 'closed']));
        return $shift;
    }
}
