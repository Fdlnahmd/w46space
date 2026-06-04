<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\AdminChatController;
use Illuminate\Support\Facades\Route;

// Auth Routes (Rate limit ketat: 10 request/menit)
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/auth/google/login', [AuthController::class, 'googleLogin']);
});

// Forgot/Reset Password (Rate limit sangat ketat: 5 request/menit)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Public Read Routes (Rate limit normal: 60 request/menit)
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/offices', [OfficeController::class, 'index']);
    Route::get('/offices/{id}', [OfficeController::class, 'show']);
    Route::get('/addons', [\App\Http\Controllers\ExtraController::class, 'getAddons']);
    Route::get('/offices/{id}/reviews', [\App\Http\Controllers\ReviewController::class, 'index']);
    Route::get('/reviews/latest', [\App\Http\Controllers\ReviewController::class, 'latest']);
});

// Invoice Public (With internal security check)
Route::get('/bookings/{id}/invoice', [InvoiceController::class, 'download']);

// Protected Routes (Perlu Login, Rate limit 120 request/menit)
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    // Pemesanan (User sendiri, admin & helpdesk)
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::put('/bookings/{id}', [BookingController::class, 'update']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);

    // Coupon check (semua user login)
    Route::post('/coupons/check', [\App\Http\Controllers\CouponController::class, 'check']);

    // Notifications (semua user login)
    Route::get('/notifications', [\App\Http\Controllers\ExtraController::class, 'getNotifications']);
    Route::patch('/notifications/read-all', [\App\Http\Controllers\ExtraController::class, 'markAllAsRead']);
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\ExtraController::class, 'markAsRead']);

    // Review (semua user login)
    Route::post('/reviews', [\App\Http\Controllers\ReviewController::class, 'store']);

    // Hybrid Chat (semua user login)
    Route::get('/chat/session', [ChatController::class, 'getSession']);
    Route::get('/chat/messages', [ChatController::class, 'getMessages']);
    Route::post('/chat/message', [ChatController::class, 'sendMessage']);
    Route::post('/chat/request-human', [ChatController::class, 'requestHuman']);
    Route::post('/chat/reset', [ChatController::class, 'resetSession']);

    // ─── Admin Only ────────────────────────────────────────────────────────────
    Route::middleware('is_admin')->group(function () {
        // Analytics
        Route::get('/admin/analytics', [AnalyticsController::class, 'getStats']);

        // Ruangan
        Route::post('/offices', [OfficeController::class, 'store']);
        Route::put('/offices/{id}', [OfficeController::class, 'update']);
        Route::delete('/offices/{id}', [OfficeController::class, 'destroy']);

        // Booking - status update & addon confirm
        Route::patch('/bookings/{id}/status', [BookingController::class, 'updateStatus']);
        Route::post('/bookings/{id}/addons', [BookingController::class, 'addAddons']);
        Route::patch('/bookings/{id}/addons/confirm', [BookingController::class, 'confirmAddon']);

        // Reviews
        Route::get('/admin/reviews', [\App\Http\Controllers\ReviewController::class, 'all']);
        Route::delete('/admin/reviews/{id}', [\App\Http\Controllers\ReviewController::class, 'destroy']);

        // Coupons
        Route::get('/admin/coupons', [\App\Http\Controllers\CouponController::class, 'index']);
        Route::post('/admin/coupons', [\App\Http\Controllers\CouponController::class, 'store']);
        Route::put('/admin/coupons/{id}', [\App\Http\Controllers\CouponController::class, 'update']);
        Route::delete('/admin/coupons/{id}', [\App\Http\Controllers\CouponController::class, 'destroy']);
    });

    // ─── Admin atau Helpdesk ───────────────────────────────────────────────────
    Route::middleware('is_admin_or_helpdesk')->group(function () {
        Route::get('/admin/chat/sessions', [AdminChatController::class, 'getSessions']);
        Route::get('/admin/chat/{id}/messages', [AdminChatController::class, 'getMessages']);
        Route::post('/admin/chat/{id}/reply', [AdminChatController::class, 'sendMessage']);
        Route::patch('/admin/chat/{id}/takeover', [AdminChatController::class, 'takeover']);
        Route::post('/admin/chat/{id}/close', [AdminChatController::class, 'closeSession']);
    });
});

