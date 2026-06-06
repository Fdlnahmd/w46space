<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // ID order unik yang dikirim ke Midtrans
            $table->string('midtrans_order_id')->nullable()->unique()->after('payment_status');
            // Snap token untuk membuka popup Midtrans di frontend
            $table->text('midtrans_snap_token')->nullable()->after('midtrans_order_id');
            // Metode pembayaran yang digunakan (gopay, bank_transfer, qris, dll)
            $table->string('midtrans_payment_type')->nullable()->after('midtrans_snap_token');
            // Waktu pembayaran berhasil dikonfirmasi Midtrans
            $table->timestamp('paid_at')->nullable()->after('midtrans_payment_type');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'midtrans_order_id',
                'midtrans_snap_token',
                'midtrans_payment_type',
                'paid_at',
            ]);
        });
    }
};
