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
                      ->where('tanggal_akhir', '>=', $today)
                      ->orderBy('tanggal_mulai');
            }])->get();

            $offices->transform(function($office) use ($today) {
                $booking = $office->bookings->first(function($booking) use ($today) {
                    return $booking->tanggal_mulai <= $today && $booking->tanggal_akhir >= $today;
                }) ?: $office->bookings->first();

                $office->is_booked = $booking ? true : false;
                $office->booked_until = $booking ? $booking->tanggal_akhir : null;
                return $office;
            });

            return $offices;
        });
    }

    public function show(int $id)
    {
        $today = date('Y-m-d');
        
        // Ambil data dasar ruangan dari cache
        $office = \Illuminate\Support\Facades\Cache::remember("office_detail_{$id}_{$today}_basic", 3600, function () use ($id, $today) {
            $data = Office::with(['bookings' => function($query) {
                $query->where('status', '!=', 'Dibatalkan');
            }])->find($id);

            if ($data) {
                $current = $data->bookings->filter(function($b) use ($today) {
                    return $b->tanggal_mulai <= $today && $b->tanggal_akhir >= $today;
                })->first();

                $future = $data->bookings
                    ->filter(fn ($b) => $b->tanggal_akhir >= $today)
                    ->sortBy('tanggal_mulai')
                    ->first();

                $booking = $current ?: $future;
                $data->is_booked = $booking ? true : false;
                $data->booked_until = $booking ? $booking->tanggal_akhir : null;
            }
            return $data;
        });

        if (!$office) {
            return response()->json(['message' => 'Ruangan tidak ditemukan'], 404);
        }

        // Periode booking dibuat fresh di luar cache supaya kalender/detail tidak telat update.
        $bookedPeriods = \Illuminate\Support\Facades\Cache::remember("office_booked_periods_{$id}_{$today}", 3600, function () use ($id, $today) {
            return \App\Models\Booking::where('office_id', $id)
                ->where('status', '!=', 'Dibatalkan')
                ->where('tanggal_akhir', '>=', $today)
                ->orderBy('tanggal_mulai')
                ->get(['id', 'tanggal_mulai', 'tanggal_akhir', 'status'])
                ->map(fn ($booking) => [
                    'id' => $booking->id,
                    'start' => $booking->tanggal_mulai->toDateString(),
                    'end' => $booking->tanggal_akhir->toDateString(),
                    'status' => $booking->status,
                ])
                ->values();
        });

        $currentPeriod = $bookedPeriods->first(function ($booking) use ($today) {
            return $booking['start'] <= $today && $booking['end'] >= $today;
        }) ?: $bookedPeriods->first();

        $office->booked_periods = $bookedPeriods;
        $office->is_booked = $currentPeriod ? true : false;
        $office->booked_until = $currentPeriod['end'] ?? null;

        // Cek status review di luar cache karena tergantung user yang sedang login
        $user = auth('sanctum')->user();
        $office->can_review = false;
        
        if ($user && strtolower($user->role) !== 'admin') {
            $office->can_review = \App\Models\Booking::where('user_id', $user->id)
                ->where('office_id', $id)
                ->whereIn('status', ['Selesai', 'Dikonfirmasi'])
                ->exists();
        }

        return response()->json($office);
    }

    private function forgetOfficeCache(?int $officeId = null): void
    {
        $today = date('Y-m-d');
        \Illuminate\Support\Facades\Cache::forget('offices_list_' . $today);

        if ($officeId) {
            \Illuminate\Support\Facades\Cache::forget("office_detail_{$officeId}_{$today}_basic");
            \Illuminate\Support\Facades\Cache::forget("office_booked_periods_{$officeId}_{$today}");
        }
    }

    public function store(Request $request)
    {
        $data = $request->all();

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('offices', 'public');
            $data['gambar'] = asset('storage/' . $path);
        }

        $office = Office::create($data);
        
        // Invalidate cache khusus ruangan, tanpa menghapus cache lain.
        $this->forgetOfficeCache($office->id);
        
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

        // Invalidate cache khusus ruangan, tanpa menghapus cache lain.
        $this->forgetOfficeCache($office->id);
        
        return response()->json($office);
    }

    public function destroy(int $id)
    {
        $office = Office::find($id);
        if ($office) {
            $office->delete();
            // Invalidate cache khusus ruangan, tanpa menghapus cache lain.
            $this->forgetOfficeCache($id);
        }
        return response()->json(['message' => 'Ruangan berhasil dihapus']);
    }
}
