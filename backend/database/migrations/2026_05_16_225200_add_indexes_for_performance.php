<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->index('status');
            $table->index(['tanggal_mulai', 'tanggal_akhir']);
            $table->index('user_id');
            $table->index('office_id');
        });

        Schema::table('offices', function (Blueprint $table) {
            $table->index('kategori');
            $table->index('is_popular');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['tanggal_mulai', 'tanggal_akhir']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['office_id']);
        });

        Schema::table('offices', function (Blueprint $table) {
            $table->dropIndex(['kategori']);
            $table->dropIndex(['is_popular']);
        });
    }
};
