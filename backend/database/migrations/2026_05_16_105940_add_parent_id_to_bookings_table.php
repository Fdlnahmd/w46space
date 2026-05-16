<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function run(): void
    {
        // Cek dulu apakah kolom sudah ada (untuk menghindari error dobel)
        if (!Schema::hasColumn('bookings', 'parent_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('office_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('bookings', 'parent_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropColumn('parent_id');
            });
        }
    }
};
