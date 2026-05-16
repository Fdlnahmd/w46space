<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Addon;
use App\Models\Coupon;

class MegaUpdateSeeder extends Seeder
{
    public function run(): void
    {
        // Addons
        Addon::updateOrCreate(['nama' => 'Coffee Break Service'], ['harga' => 150000, 'icon' => 'Coffee']);
        Addon::updateOrCreate(['nama' => 'High Speed Internet (Dedicated)'], ['harga' => 250000, 'icon' => 'Wifi']);
        Addon::updateOrCreate(['nama' => 'Extra Projector & Screen'], ['harga' => 100000, 'icon' => 'Monitor']);
        Addon::updateOrCreate(['nama' => 'Printing & Photocopy Access'], ['harga' => 50000, 'icon' => 'Printer']);

        // Coupons
        Coupon::updateOrCreate(
            ['code' => 'OFFICE10'],
            [
                'type' => 'percentage',
                'value' => 10,
                'expiry_date' => now()->addMonths(1),
            ]
        );
        Coupon::updateOrCreate(
            ['code' => 'HEMAT50RB'],
            [
                'type' => 'fixed',
                'value' => 50000,
                'expiry_date' => now()->addMonths(1),
            ]
        );
    }
}
