<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PasilleraDataUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $pasillera;
    public $transaction;
    public $user;

    public function __construct($data)
    {
        $this->pasillera = $data['pasillera'] ?? null;
        $this->transaction = $data['transaction'] ?? null;
        $this->user = $data['user'] ?? null;
    }

    public function broadcastOn()
    {
        // Por pasillera, no compartido: el payload trae su saldo y sus
        // movimientos, y en el canal comun lo recibian todas las demas.
        return new Channel('pasillera.' . ($this->pasillera->id ?? 0));
    }

    public function broadcastAs()
    {
        return 'data.updated';
    }

    public function broadcastWith()
    {
        return [
            'pasillera' => $this->pasillera,
            'transaction' => $this->transaction,
            'user' => $this->user,
        ];
    }
}
