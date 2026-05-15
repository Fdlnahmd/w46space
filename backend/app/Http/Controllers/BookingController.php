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
        $user = Auth::user();
        $booking = Booking::with('office')->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // Cek kepemilikan (Kecuali Admin)
        if (strtolower($user->role) !== 'admin' && $booking->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke pesanan ini'], 403);
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

        // CEK DOUBLE BOOKING (Poin 11)
        // Karena ini sewa bulanan, kita cek tumpang tindih rentang tanggal secara eksklusif.
        // Rumus: (StartA <= EndB) AND (EndA >= StartB)
        $bentrok = Booking::where('office_id', $validated['id_ruangan'])
            ->where('status', '!=', 'Dibatalkan')
            ->where(function ($query) use ($validated) {
                $query->where('tanggal_mulai', '<=', $validated['tanggal_akhir'])
                      ->where('tanggal_akhir', '>=', $validated['tanggal_mulai']);
            })
            ->exists();

        if ($bentrok) {
            return response()->json([
                'message' => 'Ruangan sudah dipesan pada tanggal dan jam tersebut. Silakan pilih waktu lain.'
            ], 422);
        }

        $booking = Booking::create([
            'office_id'      => $validated['id_ruangan'],
            'user_id'        => Auth::id(),
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
        $user = Auth::user();
        $booking = Booking::find($id);

        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // Hanya admin yang bisa update detail pesanan lewat sini (biasanya status)
        if (strtolower($user->role) !== 'admin' && $booking->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $data = $request->all();
        if (isset($data['id_ruangan']))  $data['office_id'] = $data['id_ruangan'];
        
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
        $user = Auth::user();
        $booking = Booking::find($id);

        if ($booking) {
            // Cek kepemilikan sebelum hapus
            if (strtolower($user->role) !== 'admin' && $booking->user_id !== $user->id) {
                return response()->json(['message' => 'Akses ditolak'], 403);
            }
            $booking->delete();
        }
        return response()->json(['message' => 'Pesanan berhasil dihapus']);
    }
}
