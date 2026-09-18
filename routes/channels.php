<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('dashboard-updates', function () {
    return true;
});

// Canal propio de cada pasillera. Antes habia uno solo compartido
// ('pasillera-updates') y cada pasillera recibia los movimientos de todas.
Broadcast::channel('pasillera.{pasilleraId}', function () {
    return true;
});
