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
    public function download(Request $request, $id)
    {
        $booking = Booking::with(['office', 'user', 'addons', 'coupon'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // Invoice hanya bisa didownload jika status pesanan Dikonfirmasi atau Selesai (sudah lunas)
        if ($booking->status !== 'Dikonfirmasi' && $booking->status !== 'Selesai') {
            return response()->json(['message' => 'Akses ditolak. Invoice hanya tersedia untuk pesanan yang sudah lunas/dikonfirmasi.'], 403);
        }

        /** @var \App\Models\User|null $user */
        $user = Auth::guard('sanctum')->user() ?: Auth::user();
        $role = strtolower($user?->role ?? '');

        if (!$user || (!in_array($role, ['admin', 'helpdesk']) && $booking->user_id !== $user->id)) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $lang = $request->query('lang', 'id');

        try {
            $englishMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            $indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

            $formattedDate = date('d F Y');
            if ($lang === 'id') {
                $formattedDate = str_replace($englishMonths, $indonesianMonths, $formattedDate);
            }

            $data = [
                'booking' => $booking,
                'date' => $formattedDate,
                'invoice_no' => 'INV-' . str_pad($booking->id, 5, '0', STR_PAD_LEFT),
                'lang' => $lang
            ];

            $pdf = PDF::setOptions([
                'isRemoteEnabled' => false,
                'isHtml5ParserEnabled' => true,
            ])->loadView('pdf.invoice', $data);

            return response($pdf->output(), 200, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $data['invoice_no'] . '.pdf"',
            ]);
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
