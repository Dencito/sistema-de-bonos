<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CashTransactionAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $transaction;
    public $shift;
    public $user;

    public function __construct($transaction, $shift, $user)
    {
        $this->transaction = $transaction;
        $this->shift = $shift;
        $this->user = $user;
    }

    public function broadcastOn()
    {
        return new Channel('pasillera-updates');
    }

    public function broadcastAs()
    {
        return 'cashtransaction.added';
    }

    public function broadcastWith()
    {
        return [
            'transaction' => $this->transaction,
            'shift' => $this->shift,
            'user' => $this->user,
        ];
    }
}
