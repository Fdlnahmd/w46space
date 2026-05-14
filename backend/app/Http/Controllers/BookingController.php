<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function index()
    {
        // Admin melihat semua, User melihat miliknya sendiri
        $user = Auth::user();
        if (strtolower($user->role) === 'admin') {
            return response()->json(Booking::with('office', 'user')->get());
        }
        return response()->json(Booking::where('user_id', $user->id)->with('office')->get());
    }

    public function show($id)
    {
        $booking = Booking::with('office')->find($id);
        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }
        return response()->json($booking);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_ruangan'     => 'required|exists:offices,id',
            'nama_pemesan'   => 'required|string',
            'perusahaan'     => 'nullable|string',
            'tanggal_mulai'  => 'required|date',
            'tanggal_akhir'  => 'required|date',
            'waktu_mulai'    => 'required',
            'waktu_selesai'  => 'required',
            'durasi'         => 'required|integer',
            'total_harga'    => 'required|numeric',
        ]);

        $booking = Booking::create([
            'office_id'     => $validated['id_ruangan'],
            'user_id'       => Auth::id(),
            'nama_pemesan'   => $validated['nama_pemesan'],
            'perusahaan'     => $validated['perusahaan'],
            'tanggal_mulai'  => $validated['tanggal_mulai'],
            'tanggal_akhir'  => $validated['tanggal_akhir'],
            'waktu_mulai'    => $validated['waktu_mulai'],
            'waktu_selesai'  => $validated['waktu_selesai'],
            'durasi'         => $validated['durasi'],
            'total_harga'    => $validated['total_harga'],
            'status'         => 'Pending'
        ]);

        return response()->json($booking, 201);
    }

    public function update(Request $request, $id)
    {
        $booking = Booking::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // Map keys if needed
        $data = $request->all();
        if (isset($data['id_ruangan']))  $data['office_id'] = $data['id_ruangan'];
        if (isset($data['id_user']))     $data['user_id'] = $data['id_user'];
        
        $booking->update($data);
        return response()->json($booking);
    }

    public function updateStatus(Request $request, $id)
    {
        $booking = Booking::find($id);
        if ($booking) {
            $booking->update(['status' => $request->status]);
        }
        return response()->json($booking);
    }

    public function destroy($id)
    {
        $booking = Booking::find($id);
        if ($booking) {
            $booking->delete();
        }
        return response()->json(['message' => 'Pesanan berhasil dihapus']);
    }
}
