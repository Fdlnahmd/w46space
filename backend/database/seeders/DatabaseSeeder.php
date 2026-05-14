<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Office;
use App\Models\Booking;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admin
        User::create([
            'name' => 'Admin Web',
            'email' => 'admin@sewaruang.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // 2. Create Regular User
        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@gmail.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);

        // 3. Create Offices (Ruangan)
        $r1 = Office::create([
            'nama' => 'Ruang Rapat Eksekutif',
            'kapasitas' => 10,
            'harga' => 500000,
            'fasilitas' => ['Proyektor', 'Papan Tulis', 'AC', 'WiFi'],
            'deskripsi' => 'Ruangan rapat nyaman dan eksklusif untuk pertemuan penting Anda.',
            'gambar' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
            'status' => 'Tersedia'
        ]);

        $r2 = Office::create([
            'nama' => 'Ruang Kolaborasi',
            'kapasitas' => 25,
            'harga' => 1200000,
            'fasilitas' => ['TV Pintar', 'Sistem Audio', 'AC', 'WiFi', 'Kopi & Teh'],
            'deskripsi' => 'Ruang luas yang cocok untuk workshop, seminar, atau kolaborasi tim.',
            'gambar' => 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
            'status' => 'Tersedia'
        ]);

        Office::create([
            'nama' => 'Private Office A',
            'kapasitas' => 4,
            'harga' => 300000,
            'fasilitas' => ['Meja Kerja', 'AC', 'WiFi', 'Loker'],
            'deskripsi' => 'Ruang kantor privat untuk startup atau tim kecil.',
            'gambar' => 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800',
            'status' => 'Penuh'
        ]);

        // 4. Create Initial Booking
        Booking::create([
            'user_id' => $user->id,
            'office_id' => $r1->id,
            'nama_pemesan' => 'Budi Santoso',
            'perusahaan' => 'PT Teknologi Maju',
            'tanggal_mulai' => '2026-05-11',
            'tanggal_akhir' => '2026-07-11',
            'durasi' => 2,
            'waktu_mulai' => '08:00',
            'waktu_selesai' => '17:00',
            'total_harga' => 3000000,
            'status' => 'Dikonfirmasi',
        ]);
    }
}
