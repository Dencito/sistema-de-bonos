<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RequestMoreBranchesMail extends Mailable
{
    use Queueable, SerializesModels;


    public $company;
    public $qty;
    public $username;

    /**
     * Crear una nueva instancia de mensaje de correo.
     *
     * @return void
     */
    public function __construct($company,$qty, $username) {
        $this->company = $company;
        $this->qty = $qty;
        $this->username = $username;
    }

    /**
     * Construir el mensaje de correo.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject("El usuario: $this->username de la empresa: $this->company solicito $this->qty sucursales mas")
                    ->view('emails.request_more_branches')
                    ->with([
                        'company' => $this->company,
                        'qty' => $this->qty,
                        'username' => $this->username,
                    ]);
    }
}
