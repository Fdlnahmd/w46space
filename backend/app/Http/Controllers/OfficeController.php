<?php

namespace App\Http\Controllers;

use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    public function index()
    {
        $today = date('Y-m-d');
        
        // Cache daftar ruangan selama 60 menit dengan key yang unik per hari
        // agar status 'is_booked' tetap akurat saat ganti hari.
        return \Illuminate\Support\Facades\Cache::remember('offices_list_' . $today, 3600, function () use ($today) {
            $offices = Office::with(['bookings' => function($query) use ($today) {
                $query->where('status', '!=', 'Dibatalkan')
                      ->where('tanggal_mulai', '<=', $today)
                      ->where('tanggal_akhir', '>=', $today);
            }])->get();

            $offices->transform(function($office) {
                $current = $office->bookings->first();
                $office->is_booked = $current ? true : false;
                $office->booked_until = $current ? $current->tanggal_akhir : null;
                return $office;
            });

            return $offices;
        });
    }

    public function show(int $id)
    {
        $today = date('Y-m-d');
        
        return \Illuminate\Support\Facades\Cache::remember("office_detail_{$id}_{$today}_full", 3600, function () use ($id, $today) {
            $office = Office::with(['bookings' => function($query) {
                $query->where('status', '!=', 'Dibatalkan');
            }])->find($id);

            if (!$office) {
                return null;
            }

            // Cari apakah hari ini sedang dipesan
            $current = $office->bookings->filter(function($b) use ($today) {
                return $b->tanggal_mulai <= $today && $b->tanggal_akhir >= $today;
            })->first();

            $office->is_booked = $current ? true : false;
            $office->booked_until = $current ? $current->tanggal_akhir : null;

            // Cek apakah user yang login boleh kasih review
            $user = auth('sanctum')->user();
            $office->can_review = false;
            
            if ($user && strtolower($user->role) !== 'admin') {
                $office->can_review = \App\Models\Booking::where('user_id', $user->id)
                    ->where('office_id', $id)
                    ->whereIn('status', ['Selesai', 'Dikonfirmasi'])
                    ->exists();
            }

            return $office;
        }) ?: response()->json(['message' => 'Ruangan tidak ditemukan'], 404);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('offices', 'public');
            $data['gambar'] = asset('storage/' . $path);
        }

        $office = Office::create($data);
        
        // Invalidate cache
        \Illuminate\Support\Facades\Cache::flush();
        
        return response()->json($office, 201);
    }

    public function update(Request $request, int $id)
    {
        $office = Office::find($id);
        if (!$office) {
            return response()->json(['message' => 'Ruangan tidak ditemukan'], 404);
        }

        $data = $request->all();

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('offices', 'public');
            $data['gambar'] = asset('storage/' . $path);
        }

        $office->update($data);

        // Invalidate cache
        \Illuminate\Support\Facades\Cache::flush();
        
        return response()->json($office);
    }

    public function destroy(int $id)
    {
        $office = Office::find($id);
        if ($office) {
            $office->delete();
            // Invalidate cache
            \Illuminate\Support\Facades\Cache::flush();
        }
        return response()->json(['message' => 'Ruangan berhasil dihapus']);
    }
}
