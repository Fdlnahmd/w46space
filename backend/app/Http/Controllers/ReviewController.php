<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function index(int $officeId)
    {
        $reviews = Review::where('office_id', $officeId)
            ->with('user:id,name')
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'office_id' => 'required|exists:offices,id',
            'rating'    => 'required|integer|min:1|max:5',
            'comment'   => 'nullable|string',
        ]);

        // Cek jumlah booking vs jumlah ulasan
        $bookingCount = Booking::where('user_id', Auth::id())
            ->where('office_id', $validated['office_id'])
            ->whereIn('status', ['Dikonfirmasi', 'Selesai'])
            ->count();
            
        $reviewCount = Review::where('user_id', Auth::id())
            ->where('office_id', $validated['office_id'])
            ->count();
            
        if ($bookingCount === 0) {
            return response()->json([
                'message' => 'Anda hanya dapat memberikan ulasan untuk ruangan yang sudah pernah Anda pesan.'
            ], 403);
        }
        
        if ($reviewCount >= $bookingCount) {
            return response()->json([
                'message' => 'Anda sudah memberikan ulasan untuk semua pemesanan Anda di ruangan ini.'
            ], 422);
        }

        $review = Review::create([
            'user_id'   => Auth::id(),
            'office_id' => $validated['office_id'],
            'rating'    => $validated['rating'],
            'comment'   => $validated['comment'],
        ]);

        return response()->json($review, 201);
    }

    public function latest()
    {
        // Ambil 6 ulasan terbaru secara global untuk Testimoni di Home
        $reviews = Review::with(['user:id,name', 'office:id,nama'])
            ->latest()
            ->take(6)
            ->get();

        return response()->json($reviews);
    }

    public function all()
    {
        // Admin: Ambil semua ulasan untuk dimoderasi
        $reviews = Review::with(['user:id,name', 'office:id,nama'])
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    public function destroy(int $id)
    {
        // Admin: Hapus ulasan
        $review = Review::find($id);
        if ($review) {
            $review->delete();
            return response()->json(['message' => 'Ulasan berhasil dihapus']);
        }
        return response()->json(['message' => 'Ulasan tidak ditemukan'], 404);
    }
}
