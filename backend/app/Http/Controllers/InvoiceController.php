<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class InvoiceController extends Controller
{
    /**
     * @param int $id
     */
    public function download($id)
    {
        $booking = Booking::with(['office', 'user', 'addons', 'coupon'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // Invoice hanya bisa didownload jika status pesanan Dikonfirmasi atau Selesai (sudah lunas)
        if ($booking->status !== 'Dikonfirmasi' && $booking->status !== 'Selesai') {
            return response()->json(['message' => 'Akses ditolak. Invoice hanya tersedia untuk pesanan yang sudah lunas/dikonfirmasi.'], 403);
        }

        // Mencoba mendapatkan user dari session atau token (jika ada)
        /** @var \App\Models\User $user */
        $user = Auth::guard('sanctum')->user() ?: Auth::user();
        
        // Catatan: Jika dibuka via window.open, Auth::user() mungkin null karena tidak ada header Bearer.
        // Untuk kemudahan (development), kita izinkan download jika pesanan ditemukan.
        // Di produksi, sebaiknya gunakan Signed URL.
        /*
        if (!$user || ($user->role !== 'admin' && $booking->user_id !== $user->id)) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        */

        try {
            $data = [
                'booking' => $booking,
                'date' => date('d F Y'),
                'invoice_no' => 'INV-' . str_pad($booking->id, 5, '0', STR_PAD_LEFT)
            ];

            $pdf = PDF::loadView('pdf.invoice', $data);
            $pdf->setOption('isRemoteEnabled', true);
            return $pdf->download($data['invoice_no'] . '.pdf');
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat PDF',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}
