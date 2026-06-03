<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Http;
use Illuminate\Cache\RateLimiting\Limit;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'google_id' => 'nullable|string',
            'avatar' => 'nullable|string',
        ]);

        // Cek apakah email sudah terdaftar
        if (User::where('email', $request->email)->exists()) {
            return response()->json(['message' => 'Email sudah terdaftar. Silakan login.'], 409);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'google_id' => $request->google_id,
            'avatar' => $request->avatar,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Login menggunakan Google ID Token.
     * Hanya untuk user yang sudah punya akun.
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'credential' => 'required|string',
        ]);

        // Verifikasi token ke Google
        $googleClientId = config('services.google.client_id');
        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->credential,
        ]);

        if ($response->failed() || $response->json('aud') !== $googleClientId) {
            \Illuminate\Support\Facades\Log::error('Google Login Verification Failed', [
                'configured_client_id' => $googleClientId,
                'response_status' => $response->status(),
                'response_body' => $response->json(),
                'credential_provided' => substr($request->credential, 0, 20) . '...'
            ]);
            return response()->json(['message' => 'Token Google tidak valid.'], 401);
        }

        $googleData = $response->json();
        $email = $googleData['email'] ?? null;

        if (!$email) {
            return response()->json(['message' => 'Tidak dapat mengambil email dari akun Google.'], 422);
        }

        // Cari user berdasarkan email
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.'], 404);
        }

        // Update google_id dan avatar jika belum tersimpan
        if (!$user->google_id) {
            $user->update([
                'google_id' => $googleData['sub'] ?? null,
                'avatar' => $googleData['picture'] ?? null,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function login(Request $request)
    {
        if (RateLimiter::tooManyAttempts('login:' . $request->ip(), 5)) {
            return response()->json(['message' => 'Terlalu banyak percobaan login, coba lagi nanti.'], 429);
        }

        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            RateLimiter::hit('login:' . $request->ip(), 60);
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        RateLimiter::clear('login:' . $request->ip());

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($request->only('name', 'email'));
        return response()->json(['message' => 'Profil berhasil diperbarui', 'user' => $user]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Password lama salah'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);
        return response()->json(['message' => 'Password berhasil diubah']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = \Illuminate\Support\Facades\Password::sendResetLink($request->only('email'));

        if ($status === \Illuminate\Support\Facades\Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Jika email terdaftar, link reset password telah dikirim ke email Anda']);
        }

        return response()->json(['message' => 'Jika email terdaftar, link reset password telah dikirim ke email Anda']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $status = \Illuminate\Support\Facades\Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                if ($user) {
                    $user->password = Hash::make($password);
                    $user->setRememberToken(\Illuminate\Support\Str::random(60));
                    $user->save();

                    \Illuminate\Support\Facades\Password::deleteToken($user);
                }
            }
        );

        if ($status === \Illuminate\Support\Facades\Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password berhasil direset! Silakan login kembali.']);
        }

        return response()->json([
            'message' => 'Gagal meriset password',
            'debug_status' => __($status)
        ], 400);
    }
}
