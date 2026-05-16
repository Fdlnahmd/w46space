<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;

class PaymentController extends Controller
{
    public function __construct()
    {
        Config::$serverKey = env('MIDTRANS_SERVER_KEY');
        Config::$isProduction = env('MIDTRANS_IS_PRODUCTION', false);
        Config::$isSanitized = env('MIDTRANS_IS_SANITIZED', true);
        Config::$is3ds = env('MIDTRANS_IS_3DS', true);
    }

    /**
     * Generate Midtrans Snap Token
     */
    public function getSnapToken(Request $request, int $id)
    {
        $booking = Booking::with('office', 'user')->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        $params = [
            'transaction_details' => [
                'order_id' => 'SR-' . $booking->id . '-' . time(),
                'gross_amount' => (int) $booking->total_harga,
            ],
            'customer_details' => [
                'first_name' => $booking->nama_pemesan,
                'email' => $booking->user->email,
            ],
            'item_details' => [
                [
                    'id' => $booking->office_id,
                    'price' => (int) $booking->total_harga,
                    'quantity' => 1,
                    'name' => "Sewa " . $booking->office->nama,
                ]
            ]
        ];

        try {
            $snapToken = Snap::getSnapToken($params);
            $booking->update(['payment_token' => $snapToken]);
            return response()->json(['token' => $snapToken]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Midtrans Webhook Callback
     */
    public function callback(Request $request)
    {
        $serverKey = env('MIDTRANS_SERVER_KEY');
        $hashed = hash("sha512", $request->order_id . $request->status_code . $request->gross_amount . $serverKey);

        if ($hashed !== $request->signature_key) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        // Extract booking ID from order_id (SR-ID-TIMESTAMP)
        $parts = explode('-', $request->order_id);
        $bookingId = $parts[1];
        $booking = Booking::find($bookingId);

        if (!$booking) return response()->json(['message' => 'Booking not found'], 404);

        $status = $request->transaction_status;

        if ($status == 'capture' || $status == 'settlement') {
            $booking->update([
                'payment_status' => 'Paid',
                'status' => 'Dikonfirmasi'
            ]);
            
            // Notif ke User
            \App\Models\Notification::create([
                'user_id' => $booking->user_id,
                'title'   => 'Pembayaran Berhasil!',
                'message' => "Pembayaran untuk pesanan #{$booking->id} telah kami terima. Selamat menikmati ruangan Anda!",
                'type'    => 'success',
                'link'    => "/pesanan-saya/{$booking->id}"
            ]);
        } elseif ($status == 'pending') {
            $booking->update(['payment_status' => 'Pending']);
        } elseif ($status == 'deny' || $status == 'expire' || $status == 'cancel') {
            $booking->update(['payment_status' => 'Failed']);
        }

        return response()->json(['message' => 'Success']);
    }
}
