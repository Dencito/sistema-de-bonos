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
use App\Traits\SentryLogging;
use Throwable;

class ProfileController extends Controller
{
    use SentryLogging;

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
        } catch (\Throwable $exception) {
            $this->logError($exception, 'profile.edit');
            throw $exception;
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
        } catch (\Throwable $exception) {
            $this->logError($exception, 'profile.update', [
                'email_changed' => $request->user()->isDirty('email')
            ]);
            throw $exception;
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
        } catch (\Throwable $exception) {
            $this->logError($exception, 'profile.destroy');
            throw $exception;
        }
    }

    protected function logError(Throwable $exception, string $context = '', array $extraData = []): void
    {
        parent::logError($exception, $context, $extraData);
    }
}
