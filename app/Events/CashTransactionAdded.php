<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Le avisa a UNA pasillera que la cajera le tocó el saldo.
 *
 * Antes salía por el canal compartido 'pasillera-updates', asi que cada
 * movimiento que registraba la cajera le llegaba a todas las pasilleras a la
 * vez, incluso los que no tenían nada que ver con ninguna. Con varias
 * pasilleras trabajando eso les tapaba el telefono de avisos.
 *
 * Ahora cada pasillera escucha su propio canal y solo recibe lo suyo.
 */
class CashTransactionAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $transaction;
    public $shift;
    public $user;
    public $pasilleraId;
    public $message;

    public function __construct($transaction, $shift, $user, $pasilleraId, ?string $message = null)
    {
        $this->transaction = $transaction;
        $this->shift = $shift;
        $this->user = $user;
        $this->pasilleraId = $pasilleraId;
        $this->message = $message;
    }

    public function broadcastOn()
    {
        return new Channel('pasillera.' . $this->pasilleraId);
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
            'pasillera_id' => $this->pasilleraId,
            'message' => $this->message,
        ];
    }
}
