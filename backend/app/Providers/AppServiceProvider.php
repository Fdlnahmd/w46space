<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.url') . '/reset-password?token=' . $token . '&email=' . $notifiable->getEmailForPasswordReset();
        });

        // Kustomisasi Isi Email Reset Password (Tema Wisma 46 Space)
        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $url = config('app.url') . '/reset-password?token=' . $token . '&email=' . $notifiable->getEmailForPasswordReset();

            return (new \Illuminate\Notifications\Messages\MailMessage)
                ->subject('[' . config('app.name') . '] Permintaan Atur Ulang Kata Sandi')
                ->view('emails.reset_password', [
                    'name' => $notifiable->name,
                    'url' => $url
                ]);
        });

        // 3. Rate Limiting Login (5 kali per menit per IP)
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
