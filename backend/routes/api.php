<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\AnalyticsController;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/offices', [OfficeController::class, 'index']);
Route::get('/offices/{id}', [OfficeController::class, 'show']);
Route::get('/addons', [\App\Http\Controllers\ExtraController::class, 'getAddons']);

// Protected Routes (Perlu Login)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    // Admin Analytics
    Route::get('/admin/analytics', [AnalyticsController::class, 'getStats']);

    // Ruangan (Admin only)
    Route::post('/offices', [OfficeController::class, 'store']);
    Route::put('/offices/{id}', [OfficeController::class, 'update']);
    Route::delete('/offices/{id}', [OfficeController::class, 'destroy']);

    // Pemesanan
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::put('/bookings/{id}', [BookingController::class, 'update']);
    Route::patch('/bookings/{id}/status', [BookingController::class, 'updateStatus']);
    Route::post('/bookings/{id}/addons', [BookingController::class, 'addAddons']);
    Route::patch('/bookings/{id}/addons/confirm', [BookingController::class, 'confirmAddon']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);

    // Review
    Route::post('/reviews', [\App\Http\Controllers\ReviewController::class, 'store']);
    Route::get('/admin/reviews', [\App\Http\Controllers\ReviewController::class, 'all']);
    Route::delete('/admin/reviews/{id}', [\App\Http\Controllers\ReviewController::class, 'destroy']);

    // Coupons, Notifications
    Route::get('/admin/coupons', [\App\Http\Controllers\CouponController::class, 'index']);
    Route::post('/admin/coupons', [\App\Http\Controllers\CouponController::class, 'store']);
    Route::put('/admin/coupons/{id}', [\App\Http\Controllers\CouponController::class, 'update']);
    Route::delete('/admin/coupons/{id}', [\App\Http\Controllers\CouponController::class, 'destroy']);
    Route::post('/coupons/check', [\App\Http\Controllers\CouponController::class, 'check']);
    
    Route::get('/notifications', [\App\Http\Controllers\ExtraController::class, 'getNotifications']);
    Route::patch('/notifications/read-all', [\App\Http\Controllers\ExtraController::class, 'markAllAsRead']);
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\ExtraController::class, 'markAsRead']);
});

// Review Public
Route::get('/offices/{id}/reviews', [\App\Http\Controllers\ReviewController::class, 'index']);
Route::get('/reviews/latest', [\App\Http\Controllers\ReviewController::class, 'latest']);

// Invoice Public (With internal security check)
Route::get('/bookings/{id}/invoice', [InvoiceController::class, 'download']);
