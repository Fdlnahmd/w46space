<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('payment_status')->default('Pending')->after('status');
            $table->string('payment_token')->nullable()->after('payment_status');
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->after('office_id');
            $table->decimal('discount_amount', 12, 2)->default(0)->after('coupon_id');
            $table->decimal('total_addon_price', 12, 2)->default(0)->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['coupon_id']);
            $table->dropColumn(['payment_status', 'payment_token', 'coupon_id', 'discount_amount', 'total_addon_price']);
        });
    }
};
