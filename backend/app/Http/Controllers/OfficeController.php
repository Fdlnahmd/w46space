<?php

namespace App\Http\Controllers;

use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    public function index()
    {
        $today = date('Y-m-d');
        $offices = Office::with(['bookings' => function($query) use ($today) {
            $query->where('status', '!=', 'Dibatalkan')
                  ->where('tanggal_mulai', '<=', $today)
                  ->where('tanggal_akhir', '>=', $today);
        }])->get();

        // Tambahkan info status dinamis
        $offices->transform(function($office) {
            $current = $office->bookings->first();
            $office->is_booked = $current ? true : false;
            $office->booked_until = $current ? $current->tanggal_akhir : null;
            return $office;
        });

        return response()->json($offices);
    }

    public function show($id)
    {
        $today = date('Y-m-d');
        $office = Office::with(['bookings' => function($query) use ($today) {
            $query->where('status', '!=', 'Dibatalkan')
                  ->where('tanggal_mulai', '<=', $today)
                  ->where('tanggal_akhir', '>=', $today);
        }])->find($id);

        if (!$office) {
            return response()->json(['message' => 'Ruangan tidak ditemukan'], 404);
        }

        $current = $office->bookings->first();
        $office->is_booked = $current ? true : false;
        $office->booked_until = $current ? $current->tanggal_akhir : null;

        return response()->json($office);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('offices', 'public');
            $data['gambar'] = asset('storage/' . $path);
        }

        $office = Office::create($data);
        return response()->json($office, 201);
    }

    public function update(Request $request, $id)
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
        return response()->json($office);
    }

    public function destroy($id)
    {
        $office = Office::find($id);
        if ($office) {
            $office->delete();
        }
        return response()->json(['message' => 'Ruangan berhasil dihapus']);
    }
}
