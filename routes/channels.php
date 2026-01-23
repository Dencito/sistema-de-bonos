<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('dashboard-updates', function () {
    return true;
});

Broadcast::channel('pasillera-updates', function () {
    return true;
});
