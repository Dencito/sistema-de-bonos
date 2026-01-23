<?php

use Illuminate\Support\Facades\Broadcast;

// Canal público para actualizaciones del dashboard
Broadcast::channel('dashboard-updates', function () {
    return true;
});
