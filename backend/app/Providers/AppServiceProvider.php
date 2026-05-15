<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Notifications\ResetPassword;

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

        // Kustomisasi Isi Email Reset Password (Tema Sewa Ruang)
        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $url = config('app.url') . '/reset-password?token=' . $token . '&email=' . $notifiable->getEmailForPasswordReset();

            return (new \Illuminate\Notifications\Messages\MailMessage)
                ->subject('[' . config('app.name') . '] Permintaan Atur Ulang Kata Sandi')
                ->greeting('Halo, ' . $notifiable->name . '!')
                ->line('Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di platform **Sewa Ruang**.')
                ->line('Silakan klik tombol di bawah ini untuk melanjutkan proses pembaruan kata sandi:')
                ->action('Atur Ulang Kata Sandi', $url)
                ->line('Tautan ini hanya berlaku selama **60 menit** demi keamanan akun Anda.')
                ->line('Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini. Keamanan akun Anda tetap terjaga selama tautan tidak diklik.')
                ->salutation("Terima kasih,\nTim " . config('app.name'));
        });
    }
}
