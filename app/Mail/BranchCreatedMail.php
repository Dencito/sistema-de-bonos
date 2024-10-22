<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BranchCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $branch;
    public $companyName;
    public $username;

    /**
     * Crear una nueva instancia de mensaje de correo.
     *
     * @return void
     */
    public function __construct($branch, $companyName, $username)
    {
        $this->branch = $branch;
        $this->companyName = $companyName;
        $this->username = $username;
    }

    /**
     * Construir el mensaje de correo.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject("El usuario: $this->username creó una nueva sucursal para la empresa: $this->companyName")
                    ->view('emails.branch_created')
                    ->with([
                        'branch' => $this->branch->name,
                        'companyName' => $this->companyName,
                        'username' => $this->username,
                    ]);
    }
}
