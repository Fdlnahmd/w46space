<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Midtrans\Config as MidtransConfig;
use Midtrans\Snap;
use Midtrans\Notification as MidtransNotification;

class PaymentController extends Controller
{
    public function __construct()
    {
        MidtransConfig::$serverKey    = config('midtrans.server_key');
        MidtransConfig::$isProduction = config('midtrans.is_production');
        MidtransConfig::$isSanitized  = true;
        MidtransConfig::$is3ds        = true;
    }

    private function invalidateBookingCaches(?Booking $booking = null): void
    {
        $today = date('Y-m-d');
        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
        \Illuminate\Support\Facades\Cache::forget('offices_list_' . $today);

        if ($booking && $booking->office_id) {
            \Illuminate\Support\Facades\Cache::forget("office_detail_{$booking->office_id}_{$today}_basic");
            \Illuminate\Support\Facades\Cache::forget("office_booked_periods_{$booking->office_id}_{$today}");
        }
    }

    /**
     * Buat Snap Token untuk booking yang belum dibayar atau addon yang pending.
     * Dipanggil user saat klik tombol "Bayar Sekarang" atau "Bayar Fasilitas Tambahan".
     */
    public function createSnapToken(int $id)
    {
        try {
            $user = Auth::user();
            $booking = Booking::with(['office', 'user', 'addons'])->find($id);

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            if (!$booking) {
                return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
            }

            if ($booking->user_id !== $user->id) {
                return response()->json(['message' => 'Akses ditolak.'], 403);
            }

            if (!$booking->user || !$booking->user->email) {
                Log::error('Midtrans createSnapToken invalid booking user', ['booking_id' => $booking->id]);
                return response()->json(['message' => 'Data pengguna pesanan tidak lengkap.'], 422);
            }

            if (!$booking->office) {
                Log::error('Midtrans createSnapToken invalid booking office', ['booking_id' => $booking->id]);
                return response()->json(['message' => 'Data ruangan pesanan tidak lengkap.'], 422);
            }

            if (!config('midtrans.server_key') || !config('midtrans.client_key')) {
                Log::error('Midtrans createSnapToken missing Midtrans keys', [
                    'has_server_key' => (bool) config('midtrans.server_key'),
                    'has_client_key' => (bool) config('midtrans.client_key'),
                ]);
                return response()->json(['message' => 'Konfigurasi pembayaran belum lengkap.'], 500);
            }

            $pendingAddons = $booking->addons()->wherePivot('status', 'pending')->get();
            $pendingAddonsPrice = 0;
            foreach ($pendingAddons as $addon) {
                $pendingAddonsPrice += (float) $addon->pivot->price_at_booking;
            }

            $isPayingAddons = false;
            if (strtolower((string) $booking->payment_status) === 'paid') {
                if ($pendingAddonsPrice <= 0) {
                    return response()->json(['message' => 'Pesanan ini sudah dibayar dan tidak ada fasilitas tambahan yang perlu dibayar.'], 422);
                }
                $isPayingAddons = true;
            }

            if ($isPayingAddons) {
                $orderId = 'ADDONS-' . $booking->id . '-' . time();
                $params = [
                    'transaction_details' => [
                        'order_id'     => $orderId,
                        'gross_amount' => (int) $pendingAddonsPrice,
                    ],
                    'customer_details' => [
                        'first_name' => $booking->nama_pemesan,
                        'email'      => $booking->user->email,
                    ],
                    'item_details' => [],
                    'callbacks' => [
                        'finish' => config('app.url'),
                    ],
                ];

                foreach ($pendingAddons as $addon) {
                    $params['item_details'][] = [
                        'id'       => 'ADDON-' . $addon->id,
                        'price'    => (int) $addon->pivot->price_at_booking,
                        'quantity' => 1,
                        'name'     => 'Fasilitas: ' . $addon->nama,
                    ];
                }
            } else {
                if ($booking->midtrans_snap_token && strtolower((string) $booking->payment_status) === 'pending') {
                    return response()->json([
                        'snap_token' => $booking->midtrans_snap_token,
                        'client_key' => config('midtrans.client_key'),
                        'snap_url'   => config('midtrans.snap_url'),
                    ]);
                }

                $orderId = 'BOOKING-' . $booking->id . '-' . time();
                $roomPrice = (int) ($booking->total_harga - $booking->total_addon_price + $booking->discount_amount);

                $params = [
                    'transaction_details' => [
                        'order_id'     => $orderId,
                        'gross_amount' => (int) $booking->total_harga,
                    ],
                    'customer_details' => [
                        'first_name' => $booking->nama_pemesan,
                        'email'      => $booking->user->email,
                    ],
                    'item_details' => [
                        [
                            'id'       => 'ROOM-' . $booking->office_id,
                            'price'    => $roomPrice,
                            'quantity' => 1,
                            'name'     => 'Sewa ' . $booking->office->nama . ' (' . $booking->durasi . ' Bulan)',
                        ],
                    ],
                    'callbacks' => [
                        'finish' => config('app.url'),
                    ],
                ];

                if ($booking->total_addon_price > 0) {
                    $params['item_details'][] = [
                        'id'       => 'ADDONS-' . $booking->id,
                        'price'    => (int) $booking->total_addon_price,
                        'quantity' => 1,
                        'name'     => 'Fasilitas Tambahan',
                    ];
                }

                if ($booking->discount_amount > 0) {
                    $params['item_details'][] = [
                        'id'       => 'DISCOUNT-' . $booking->id,
                        'price'    => -(int) $booking->discount_amount,
                        'quantity' => 1,
                        'name'     => 'Diskon Kupon',
                    ];
                }
            }

            $snapToken = Snap::getSnapToken($params);

            if ($isPayingAddons) {
                $booking->update([
                    'midtrans_order_id'   => $orderId,
                    'midtrans_snap_token' => $snapToken,
                ]);
            } else {
                $booking->update([
                    'midtrans_order_id'   => $orderId,
                    'midtrans_snap_token' => $snapToken,
                    'payment_status'      => 'pending',
                ]);
            }

            return response()->json([
                'snap_token' => $snapToken,
                'client_key' => config('midtrans.client_key'),
                'snap_url'   => config('midtrans.snap_url'),
            ]);
        } catch (\Throwable $e) {
            Log::error('Midtrans createSnapToken error', [
                'booking_id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json(['message' => 'Gagal membuat sesi pembayaran. Coba lagi nanti.'], 500);
        }
    }

    /**
     * Webhook handler — dipanggil otomatis oleh server Midtrans setelah transaksi.
     * Route ini PUBLIC (tanpa auth), tapi divalidasi dengan signature key.
     */
    public function webhook(Request $request)
    {
        try {
            $notification = new MidtransNotification();

            $orderId           = $notification->order_id;
            $transactionStatus = $notification->transaction_status;
            $fraudStatus       = $notification->fraud_status;
            $paymentType       = $notification->payment_type;
            $expectedSignature = hash(
                'sha512',
                $notification->order_id . $notification->status_code . $notification->gross_amount . config('midtrans.server_key')
            );

            if (!hash_equals($expectedSignature, $notification->signature_key ?? '')) {
                Log::warning('Midtrans Webhook invalid signature', ['order_id' => $orderId]);
                return response()->json(['message' => 'Invalid signature.'], 403);
            }

            Log::info('Midtrans Webhook', [
                'order_id' => $orderId,
                'status'   => $transactionStatus,
                'fraud'    => $fraudStatus,
            ]);

            $isAddonPayment = str_starts_with($orderId, 'ADDONS-');
            if ($isAddonPayment) {
                $parts = explode('-', $orderId);
                $bookingId = $parts[1] ?? null;
                $booking = Booking::with('addons')->find($bookingId);
            } else {
                $booking = Booking::where('midtrans_order_id', $orderId)->first();
            }

            if (!$booking) {
                return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
            }

            $oldPaymentStatus = strtolower((string) $booking->payment_status);
            $oldBookingStatus = $booking->status;

            // Tentukan payment_status berdasarkan status dari Midtrans
            $paymentStatus = match(true) {
                $transactionStatus === 'capture' && $fraudStatus === 'accept' => 'paid',
                $transactionStatus === 'settlement'                            => 'paid',
                $transactionStatus === 'pending'                               => 'pending',
                in_array($transactionStatus, ['deny', 'cancel', 'failure'])    => 'failed',
                $transactionStatus === 'expire'                                => 'expired',
                default                                                        => $booking->payment_status,
            };

            $resolvedPaymentType = $this->resolvePaymentMethod($notification);

            if ($isAddonPayment) {
                if ($paymentStatus === 'paid') {
                    $pendingAddons = $booking->addons()->wherePivot('status', 'pending')->get();
                    if ($pendingAddons->isEmpty()) {
                        return response()->json(['status' => 'ok']);
                    }

                    $addonNames = [];
                    foreach ($pendingAddons as $addon) {
                        $booking->addons()->updateExistingPivot($addon->id, ['status' => 'confirmed']);
                        $price = $addon->pivot->price_at_booking;
                        $booking->increment('total_harga', $price);
                        $booking->increment('total_addon_price', $price);
                        $addonNames[] = $addon->nama;
                    }
                    $addonsList = implode(', ', $addonNames);
                    $booking->update(['midtrans_payment_type' => $resolvedPaymentType]);

                    // Kirim notifikasi ke user bahwa pembayaran addon berhasil
                    Notification::create([
                        'user_id' => $booking->user_id,
                        'title'   => 'Pembayaran Fasilitas Berhasil ✅',
                        'message' => "Pembayaran untuk fasilitas tambahan ({$addonsList}) pada pesanan #{$booking->id} telah berhasil.",
                        'type'    => 'success',
                        'link'    => "/pesanan-saya/{$booking->id}",
                    ]);

                    // Notifikasi ke admin
                    Notification::create([
                        'user_id' => null,
                        'title'   => 'Pembayaran Fasilitas Diterima 💰',
                        'message' => "Pembayaran fasilitas tambahan untuk pesanan #{$booking->id} dari {$booking->nama_pemesan} telah diterima via {$resolvedPaymentType}.",
                        'type'    => 'success',
                        'link'    => "/admin/pemesanan/{$booking->id}",
                    ]);
                }
                return response()->json(['status' => 'ok']);
            }

            $updateData = [
                'payment_status'         => $paymentStatus,
                'midtrans_payment_type'  => $resolvedPaymentType,
            ];

            if ($paymentStatus === 'paid') {
                $updateData['paid_at'] = $booking->paid_at ?: now();
                $updateData['status'] = 'Dikonfirmasi';

                if ($oldPaymentStatus !== 'paid') {
                    // Kirim notifikasi ke user bahwa pembayaran berhasil
                    Notification::create([
                        'user_id' => $booking->user_id,
                        'title'   => 'Pembayaran Berhasil ✅',
                        'message' => "Pembayaran untuk pesanan #{$booking->id} telah dikonfirmasi dan pesanan otomatis aktif.",
                        'type'    => 'success',
                        'link'    => "/pesanan-saya/{$booking->id}",
                    ]);

                    // Notifikasi ke admin
                    Notification::create([
                        'user_id' => null,
                        'title'   => 'Pembayaran Diterima 💰',
                        'message' => "Pesanan #{$booking->id} dari {$booking->nama_pemesan} telah dibayar via {$resolvedPaymentType}.",
                        'type'    => 'success',
                        'link'    => "/admin/pemesanan/{$booking->id}",
                    ]);
                }
            } elseif (in_array($paymentStatus, ['failed', 'expired'])) {
                $updateData['status'] = 'Dibatalkan';
                $alreadyCanceled = $oldBookingStatus === 'Dibatalkan' || in_array($oldPaymentStatus, ['failed', 'expired']);

                if (!$alreadyCanceled && $booking->coupon_id) {
                    \App\Models\Coupon::where('id', $booking->coupon_id)->where('used_count', '>', 0)->decrement('used_count');
                }

                if (!$alreadyCanceled) {
                    // Notifikasi ke user bahwa pembayaran gagal/expired
                    Notification::create([
                        'user_id' => $booking->user_id,
                        'title'   => 'Pembayaran Gagal ❌',
                        'message' => "Pembayaran untuk pesanan #{$booking->id} " . ($paymentStatus === 'expired' ? 'kedaluwarsa' : 'gagal') . ". Silakan coba lagi.",
                        'type'    => 'danger',
                        'link'    => "/pesanan-saya/{$booking->id}",
                    ]);
                }
            }

            $booking->update($updateData);
            $this->invalidateBookingCaches($booking);

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            Log::error('Midtrans Webhook error: ' . $e->getMessage());
            return response()->json(['message' => 'Webhook error.'], 500);
        }
    }

    /**
     * Membantu menerjemahkan tipe pembayaran Midtrans menjadi teks yang ramah pengguna.
     */
    private function resolvePaymentMethod($notification)
    {
        $type = $notification->payment_type ?? 'unknown';
        
        switch ($type) {
            case 'credit_card':
                $bank = $notification->bank ?? '';
                return 'Kartu Kredit' . ($bank ? ' (' . strtoupper($bank) . ')' : '');
            case 'bank_transfer':
                if (is_array($notification->va_numbers) && isset($notification->va_numbers[0]->bank)) {
                    return 'Transfer Bank (' . strtoupper($notification->va_numbers[0]->bank) . ')';
                }
                if (isset($notification->permata_va_number)) {
                    return 'Transfer Bank (PERMATA)';
                }
                return 'Transfer Bank';
            case 'echannel':
                return 'Transfer Bank (MANDIRI)';
            case 'gopay':
                return 'GoPay';
            case 'shopeepay':
                return 'ShopeePay';
            case 'qris':
                return 'QRIS';
            case 'cstore':
                $store = $notification->store ?? '';
                return 'Gerai Ritel (' . ($store ? ucfirst($store) : 'Indomaret/Alfamart') . ')';
            default:
                return ucwords(str_replace('_', ' ', $type));
        }
    }
}
