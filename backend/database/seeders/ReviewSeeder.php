<?php

namespace Database\Seeders;

use App\Models\Review;
use App\Models\User;
use App\Models\Office;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('role', 'user')->first();
        $offices = Office::all();

        if (!$user || $offices->isEmpty()) {
            return;
        }

        foreach ($offices as $office) {
            Review::create([
                'user_id'   => $user->id,
                'office_id' => $office->id,
                'rating'    => rand(4, 5),
                'comment'   => 'Ruangannya sangat nyaman dan fasilitasnya lengkap. Sangat merekomendasikan untuk kerja tim!',
            ]);
        }
    }
}
