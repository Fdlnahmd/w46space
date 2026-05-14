<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('office_id')->constrained()->onDelete('cascade');
            $table->string('nama_pemesan');
            $table->string('perusahaan')->nullable();
            $table->date('tanggal_mulai');
            $table->date('tanggal_akhir');
            $table->integer('durasi'); // dalam bulan
            $table->time('waktu_mulai')->default('08:00');
            $table->time('waktu_selesai')->default('17:00');
            $table->decimal('total_harga', 15, 2);
            $table->string('status')->default('Pending'); // Pending, Dikonfirmasi, Selesai, Dibatalkan
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
