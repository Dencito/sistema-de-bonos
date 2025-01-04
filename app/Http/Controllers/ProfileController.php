<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Sentry\State\HubInterface;
use Sentry\State\Scope;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        try {
            return Inertia::render('Profile/Edit', [
                'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
                'status' => session('status'),
            ]);
        } catch (\Throwable $e) {
            $this->logError($e, 'profile.edit');
            throw $e;
        }
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        try {
            $request->user()->fill($request->validated());

            if ($request->user()->isDirty('email')) {
                $request->user()->email_verified_at = null;
            }

            $request->user()->save();

            return Redirect::route('profile.edit');
        } catch (\Throwable $e) {
            $this->logError($e, 'profile.update', [
                'email_changed' => $request->user()->isDirty('email')
            ]);
            throw $e;
        }
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        try {
            $request->validate([
                'password' => ['required', 'current_password'],
            ]);

            $user = $request->user();

            Auth::logout();

            $user->delete();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return Redirect::to('/');
        } catch (\Throwable $e) {
            $this->logError($e, 'profile.destroy');
            throw $e;
        }
    }

    protected function logError(\Throwable $e, string $transaction, array $extra = []): void
    {
        /** @var HubInterface $sentry */
        $sentry = app(HubInterface::class);
        $sentry->captureException($e, [
            'transaction' => $transaction,
            'extra' => $extra,
        ]);
    }
}
