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
        Schema::create('reviews', function (Blueprint $user_id) {
            $user_id->id();
            $user_id->foreignId('user_id')->constrained()->onDelete('cascade');
            $user_id->foreignId('office_id')->constrained()->onDelete('cascade');
            $user_id->integer('rating');
            $user_id->text('comment')->nullable();
            $user_id->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
