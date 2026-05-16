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
        $offices = [
            [
                'nama' => 'Ruang Rapat Eksekutif',
                'kategori' => 'Meeting Room',
                'kapasitas' => 12,
                'harga' => 750000,
                'fasilitas' => ['Proyektor 4K', 'Papan Tulis Kaca', 'AC Central', 'WiFi High Speed', 'Snack Box'],
                'deskripsi' => 'Ruangan rapat premium dengan pemandangan kota, sangat cocok untuk pertemuan direksi dan klien penting.',
                'gambar' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => true
            ],
            [
                'nama' => 'Creative Studio Hub',
                'kategori' => 'Creative Space',
                'kapasitas' => 8,
                'harga' => 450000,
                'fasilitas' => ['Green Screen', 'Lighting Studio', 'AC', 'WiFi High Speed', 'Podcasting Kit'],
                'deskripsi' => 'Ruang kolaborasi yang dirancang khusus untuk konten kreator, desainer, dan tim kreatif.',
                'gambar' => 'https://images.unsplash.com/photo-1598425237654-4fc758e50a93?auto=format&fit=crop&q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => true
            ],
            [
                'nama' => 'Grand Ballroom Convention',
                'kategori' => 'Event Space',
                'kapasitas' => 100,
                'harga' => 5500000,
                'fasilitas' => ['Sound System 5000W', 'LED Screen Huge', 'AC Central', 'Catering Area', 'Parking Lot'],
                'deskripsi' => 'Aula besar yang mewah untuk acara seminar berskala besar, konferensi, hingga acara gathering perusahaan.',
                'gambar' => 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => false
            ],
            [
                'nama' => 'Open Coworking Area',
                'kategori' => 'Coworking Space',
                'kapasitas' => 20,
                'harga' => 150000,
                'fasilitas' => ['Dedicated Desk', 'AC', 'WiFi', 'Locker', 'Free Flow Coffee'],
                'deskripsi' => 'Area kerja terbuka yang tenang dengan suasana tenang, cocok untuk freelancer dan digital nomad.',
                'gambar' => 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => true
            ],
            [
                'nama' => 'Corporate Suite A',
                'kategori' => 'Office',
                'kapasitas' => 10,
                'harga' => 2500000,
                'fasilitas' => ['Receptionist', 'Private Toilet', 'AC', 'WiFi High Speed', 'Cleaning Service'],
                'deskripsi' => 'Kantor korporat siap pakai dengan alamat bisnis prestisius dan layanan resepsionis.',
                'gambar' => 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => false
            ],
            [
                'nama' => 'Innovation Lab',
                'kategori' => 'Creative Space',
                'kapasitas' => 15,
                'harga' => 1200000,
                'fasilitas' => ['3D Printer', 'VR Headsets', 'AC', 'Fiber Internet', 'Workbench'],
                'deskripsi' => 'Ruang kerja khusus untuk riset, pengembangan produk, dan eksperimen teknologi.',
                'gambar' => 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => false
            ],
            [
                'nama' => 'Smart Office Hub',
                'kategori' => 'Office',
                'kapasitas' => 6,
                'harga' => 950000,
                'fasilitas' => ['Smart Lock', 'IoT Lighting', 'AC', 'WiFi', 'Modern Furniture'],
                'deskripsi' => 'Kantor modern berbasis teknologi yang efisien dan nyaman untuk produktivitas tim.',
                'gambar' => 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => false
            ],
            [
                'nama' => 'Communal Workspace B',
                'kategori' => 'Coworking Space',
                'kapasitas' => 30,
                'harga' => 100000,
                'fasilitas' => ['High Speed WiFi', 'Shared Pantry', 'AC', 'Comfy Sofa'],
                'deskripsi' => 'Ruang komunal santai untuk bekerja sambil berjejaring dengan profesional lainnya.',
                'gambar' => 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => false
            ],
            [
                'nama' => 'Penthouse Executive Suite',
                'kategori' => 'Private Office',
                'kapasitas' => 4,
                'harga' => 3500000,
                'fasilitas' => ['Ergonomic Chair', 'Private Balcony', 'AC', 'Fiber Internet', 'Coffee Machine'],
                'deskripsi' => 'Kantor privat eksklusif dengan pemandangan luar biasa dan fasilitas mewah untuk tim kecil.',
                'gambar' => 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => true
            ],
            [
                'nama' => 'Stealth Startup Pod',
                'kategori' => 'Private Office',
                'kapasitas' => 3,
                'harga' => 1500000,
                'fasilitas' => ['Whiteboard Wall', 'Soundproof', 'AC', 'WiFi', '24/7 Access'],
                'deskripsi' => 'Ruang privat minimalis yang fokus pada produktivitas, sangat cocok untuk startup tahap awal.',
                'gambar' => 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800',
                'status' => 'Tersedia',
                'is_popular' => false
            ]
        ];

        foreach ($offices as $office) {
            Office::create($office);
        }

        $r1 = Office::where('nama', 'Ruang Rapat Eksekutif')->first();

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
            'total_harga' => 1500000,
            'status' => 'Dikonfirmasi',
        ]);

        // 6. Mega Update Features (Addons, Coupons)
        $this->call(MegaUpdateSeeder::class);
    }
}
