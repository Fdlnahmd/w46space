<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Coupon;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Midtrans\Config as MidtransConfig;
use Midtrans\Transaction as MidtransTransaction;

class BookingController extends Controller
{
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

    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->query('per_page', 15);
        
        $query = Booking::with('office', 'user', 'addons')->orderBy('created_at', 'desc');

        if (!in_array(strtolower($user->role), ['admin', 'helpdesk'])) {
            $query->where('user_id', $user->id);
        }

        $bookings = $query->paginate($perPage);
        $bookings->getCollection()->transform(function (Booking $booking) {
            return $this->syncMidtransPaymentStatus($booking)->loadMissing('office', 'user', 'addons');
        });

        return response()->json($bookings);
    }

    public function show(int $id)
    {
        $user = Auth::user();
        $booking = Booking::with(['office', 'addons'])->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // Cek kepemilikan (Kecuali Admin & Helpdesk)
        if (!in_array(strtolower($user->role), ['admin', 'helpdesk']) && $booking->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke pesanan ini'], 403);
        }

        $booking = $this->syncMidtransPaymentStatus($booking);

        return response()->json($booking);
    }

    private function syncMidtransPaymentStatus(Booking $booking): Booking
    {
        $orderId = (string) $booking->midtrans_order_id;
        $isAddonOrder = str_starts_with($orderId, 'ADDONS-');
        $hasPendingAddons = $booking->addons()->wherePivot('status', 'pending')->exists();

        if (!$isAddonOrder && strtolower((string) $booking->payment_status) === 'paid' && $booking->status === 'Pending') {
            $booking->update(['status' => 'Dikonfirmasi']);
            $this->invalidateBookingCaches($booking);
            return $booking->refresh();
        }

        if (
            !$orderId ||
            (!$isAddonOrder && $booking->status !== 'Pending') ||
            (!$isAddonOrder && strtolower((string) $booking->payment_status) === 'paid') ||
            ($isAddonOrder && !$hasPendingAddons)
        ) {
            return $booking;
        }

        try {
            MidtransConfig::$serverKey    = config('midtrans.server_key');
            MidtransConfig::$isProduction = config('midtrans.is_production');
            MidtransConfig::$isSanitized  = true;
            MidtransConfig::$is3ds        = true;

            $status = MidtransTransaction::status($orderId);
            $transactionStatus = $status->transaction_status ?? null;
            $fraudStatus = $status->fraud_status ?? null;
            $paymentType = $status->payment_type ?? null;

            if (!$transactionStatus) {
                return $booking;
            }

            $paymentStatus = match (true) {
                $transactionStatus === 'capture' && $fraudStatus === 'accept' => 'paid',
                $transactionStatus === 'settlement'                            => 'paid',
                $transactionStatus === 'pending'                               => 'pending',
                in_array($transactionStatus, ['deny', 'cancel', 'failure'])    => 'failed',
                $transactionStatus === 'expire'                                => 'expired',
                default                                                        => $booking->payment_status,
            };

            $resolvedPaymentType = $paymentType ? ucwords(str_replace('_', ' ', $paymentType)) : 'Unknown';

            if ($isAddonOrder) {
                if ($paymentStatus !== 'paid') {
                    return $booking;
                }

                $pendingAddons = $booking->addons()->wherePivot('status', 'pending')->get();
                if ($pendingAddons->isEmpty()) {
                    return $booking;
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

                Notification::create([
                    'user_id' => $booking->user_id,
                    'title'   => 'Pembayaran Fasilitas Berhasil ✅',
                    'message' => "Pembayaran untuk fasilitas tambahan ({$addonsList}) pada pesanan #{$booking->id} telah berhasil.",
                    'type'    => 'success',
                    'link'    => "/pesanan-saya/{$booking->id}",
                ]);

                Notification::create([
                    'user_id' => null,
                    'title'   => 'Pembayaran Fasilitas Diterima 💰',
                    'message' => "Pembayaran fasilitas tambahan untuk pesanan #{$booking->id} dari {$booking->nama_pemesan} telah diterima via {$resolvedPaymentType}.",
                    'type'    => 'success',
                    'link'    => "/admin/pemesanan/{$booking->id}",
                ]);

                return $booking->refresh();
            }

            if ($paymentStatus === $booking->payment_status) {
                return $booking;
            }

            $updateData = [
                'payment_status' => $paymentStatus,
                'midtrans_payment_type' => $resolvedPaymentType,
            ];

            if ($paymentStatus === 'paid') {
                $updateData['paid_at'] = now();
                $updateData['status'] = 'Dikonfirmasi';

                Notification::create([
                    'user_id' => $booking->user_id,
                    'title'   => 'Pembayaran Berhasil ✅',
                    'message' => "Pembayaran untuk pesanan #{$booking->id} telah dikonfirmasi dan pesanan otomatis aktif.",
                    'type'    => 'success',
                    'link'    => "/pesanan-saya/{$booking->id}",
                ]);

                Notification::create([
                    'user_id' => null,
                    'title'   => 'Pembayaran Diterima 💰',
                    'message' => "Pesanan #{$booking->id} dari {$booking->nama_pemesan} telah dibayar.",
                    'type'    => 'success',
                    'link'    => "/admin/pemesanan/{$booking->id}",
                ]);
            } elseif (in_array($paymentStatus, ['failed', 'expired'])) {
                $updateData['status'] = 'Dibatalkan';
                if ($booking->coupon_id) {
                    Coupon::where('id', $booking->coupon_id)->where('used_count', '>', 0)->decrement('used_count');
                }

                Notification::create([
                    'user_id' => $booking->user_id,
                    'title'   => 'Pembayaran Gagal ❌',
                    'message' => "Pembayaran untuk pesanan #{$booking->id} " . ($paymentStatus === 'expired' ? 'kedaluwarsa' : 'gagal') . ". Silakan coba lagi.",
                    'type'    => 'danger',
                    'link'    => "/pesanan-saya/{$booking->id}",
                ]);
            }

            $booking->update($updateData);
            $this->invalidateBookingCaches($booking);
            return $booking->refresh();
        } catch (\Throwable $e) {
            Log::warning('Midtrans automatic sync failed for booking ' . $booking->id . ': ' . $e->getMessage());
            return $booking;
        }
    }


    public function store(Request $request)
    {
        $user = Auth::user();
        if (in_array(strtolower($user->role), ['admin', 'helpdesk'])) {
            return response()->json(['message' => 'Akun Admin/Helpdesk tidak diperbolehkan melakukan pemesanan.'], 403);
        }

        $validated = $request->validate([
            'id_ruangan'     => 'required|exists:offices,id',
            'parent_id'      => 'nullable|exists:bookings,id',
            'nama_pemesan'   => 'required|string',
            'perusahaan'     => 'nullable|string',
            'tanggal_mulai'  => 'required|date',
            'tanggal_akhir'  => 'required|date|after_or_equal:tanggal_mulai',
            'waktu_mulai'    => 'required',
            'waktu_selesai'  => 'required|after:waktu_mulai',
            'durasi'         => 'required|integer|min:1',
            'total_harga'    => 'required|numeric|min:0',
            'coupon_code'    => 'nullable|string',
            'addon_ids'      => 'nullable|array',
            'addon_ids.*'    => 'exists:addons,id',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request) {
            $office = \App\Models\Office::where('id', $validated['id_ruangan'])->lockForUpdate()->first();

            // Check Double Booking
            $bentrok = Booking::where('office_id', $validated['id_ruangan'])
                ->where('status', '!=', 'Dibatalkan')
                ->where(function ($query) use ($validated) {
                    $query->where('tanggal_mulai', '<=', $validated['tanggal_akhir'])
                          ->where('tanggal_akhir', '>=', $validated['tanggal_mulai']);
                })
                ->exists();

            if ($bentrok) {
                return response()->json(['message' => 'Ruangan sudah dipesan pada tanggal tersebut.'], 422);
            }

            // Handle Addons
            $totalAddonPrice = 0;
            $addonsData = [];
            if ($request->has('addon_ids') && is_array($request->addon_ids)) {
                $addons = \App\Models\Addon::whereIn('id', $request->addon_ids)->get();
                foreach ($addons as $addon) {
                    $totalAddonPrice += (float)$addon->harga;
                    $addonsData[$addon->id] = ['price_at_booking' => $addon->harga];
                }
            }

            // Calculate Base Price (harga per hari * 26 hari kerja * durasi bulan)
            $basePrice = (float)$office->harga * 26 * (int)$validated['durasi'];

            // Handle Coupon
            $couponId = null;
            $discountAmount = 0;
            if ($validated['coupon_code']) {
                $coupon = \App\Models\Coupon::where('code', $validated['coupon_code'])->first();
                if ($coupon && !$coupon->isExpired() && !$coupon->isLimitReached()) {
                    $couponId = $coupon->id;
                    if ($coupon->type === 'percentage') {
                        $discountAmount = ($basePrice * (float)$coupon->value) / 100;
                    } else {
                        $discountAmount = (float)$coupon->value;
                    }
                    $coupon->increment('used_count');
                }
            }

            $discountAmount = min($discountAmount, $basePrice + $totalAddonPrice);
            $finalTotal = max(0, $basePrice + $totalAddonPrice - $discountAmount);

            $booking = Booking::create([
                'office_id'         => $validated['id_ruangan'],
                'user_id'           => Auth::id(),
                'parent_id'         => $validated['parent_id'] ?? null,
                'nama_pemesan'      => $validated['nama_pemesan'],
                'perusahaan'        => $validated['perusahaan'],
                'tanggal_mulai'     => $validated['tanggal_mulai'],
                'tanggal_akhir'     => $validated['tanggal_akhir'],
                'waktu_mulai'       => $validated['waktu_mulai'],
                'waktu_selesai'     => $validated['waktu_selesai'],
                'durasi'            => $validated['durasi'],
                'total_harga'       => $finalTotal,
                'coupon_id'         => $couponId,
                'discount_amount'   => $discountAmount,
                'total_addon_price' => $totalAddonPrice,
                'status'            => 'Pending',
                'payment_status'    => 'Pending'
            ]);

            // Sync Addons
            if (!empty($addonsData)) {
                $booking->addons()->sync($addonsData);
            }

            // Create Notification for Admin
            \App\Models\Notification::create([
                'user_id' => null, // null for admin
                'title'   => 'Pesanan Baru Masuk!',
                'message' => "Pesanan baru dari {$validated['nama_pemesan']} untuk ruangan {$office->nama}.",
                'type'    => 'info',
                'link'    => "/admin/pemesanan/{$booking->id}"
            ]);

            $this->invalidateBookingCaches($booking);

            return response()->json($booking, 201);
        });
    }


    public function update(Request $request, int $id)
    {
        $user = Auth::user();
        $booking = Booking::find($id);

        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // Hanya admin/helpdesk yang bisa update detail pesanan lewat endpoint ini.
        if (!in_array(strtolower($user->role), ['admin', 'helpdesk'])) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $data = $request->except(['payment_status', 'midtrans_order_id', 'midtrans_snap_token', 'midtrans_payment_type', 'paid_at']);
        if (isset($data['id_ruangan']))  $data['office_id'] = $data['id_ruangan'];
        
        $booking->update($data);

        if ($request->has('addon_ids')) {
            $addonsData = [];
            $totalAddonPrice = 0;
            if (is_array($request->addon_ids)) {
                $addons = \App\Models\Addon::whereIn('id', $request->addon_ids)->get();
                foreach ($addons as $addon) {
                    $totalAddonPrice += (float)$addon->harga;
                    $addonsData[$addon->id] = [
                        'price_at_booking' => $addon->harga,
                        'status'           => 'confirmed'
                    ];
                }
            }
            $booking->addons()->sync($addonsData);
            $booking->update([
                'total_addon_price' => $totalAddonPrice
            ]);
        }

        return response()->json($booking->load('addons'));
    }

    public function updateStatus(Request $request, int $id)
    {
        $booking = Booking::with('office')->find($id);
        if (!$booking) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        $request->validate([
            'status' => 'required|in:Pending,Dikonfirmasi,Selesai,Dibatalkan',
        ]);

        $user = $request->user();
        $isAdmin = $user && strtolower($user->role) === 'admin';

        // Check authorization: if not admin, user can only cancel their own booking
        if (!$isAdmin) {
            if ($booking->user_id !== $user->id) {
                return response()->json(['message' => 'Akses ditolak.'], 403);
            }
            if ($request->status !== 'Dibatalkan') {
                return response()->json(['message' => 'Hanya admin yang dapat menyetujui pesanan.'], 403);
            }
            if ($booking->status !== 'Pending' || strtolower((string) $booking->payment_status) === 'paid') {
                return response()->json(['message' => 'Pesanan yang sudah dibayar atau diproses tidak dapat dibatalkan mandiri.'], 422);
            }
        }

        $oldStatus = $booking->status;
        $newStatus = $request->status;

        if ($isAdmin && in_array($newStatus, ['Dikonfirmasi', 'Selesai']) && strtolower((string) $booking->payment_status) !== 'paid') {
            return response()->json(['message' => 'Pesanan belum dibayar, status tidak dapat dikonfirmasi.'], 422);
        }

        $updateData = ['status' => $newStatus];
        
        if ($newStatus === 'Dibatalkan' && $oldStatus !== 'Dibatalkan') {
            if ($booking->coupon_id) {
                \App\Models\Coupon::where('id', $booking->coupon_id)->where('used_count', '>', 0)->decrement('used_count');
            }
        }

        $booking->update($updateData);

        // Create notification for User
        \App\Models\Notification::create([
            'user_id' => $booking->user_id,
            'title'   => "Status Pesanan #{$booking->id} Berubah",
            'message' => "Pesanan Anda untuk {$booking->office->nama} sekarang berstatus: {$newStatus}.",
            'type'    => $newStatus === 'Dikonfirmasi' ? 'success' : ($newStatus === 'Dibatalkan' ? 'danger' : 'info'),
            'link'    => "/pesanan-saya/{$booking->id}"
        ]);

        // Invalidate cache terkait booking saja, tanpa menghapus semua cache aplikasi.
        $this->invalidateBookingCaches($booking);

        return response()->json($booking);
    }

    public function addAddons(Request $request, int $id)
    {
        $booking = Booking::find($id);
        if (!$booking) return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);

        $user = Auth::user();
        if (!in_array(strtolower($user->role), ['admin', 'helpdesk']) && $booking->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke pesanan ini'], 403);
        }

        $paymentStatus = strtolower((string) $booking->payment_status);
        $isPaid = $paymentStatus === 'paid';
        $canAddBeforePayment = $booking->status === 'Pending' && !$isPaid;

        if ($isPaid && $booking->status !== 'Dikonfirmasi') {
            return response()->json(['message' => 'Fasilitas tambahan hanya dapat dibayar setelah pesanan dikonfirmasi. Muat ulang halaman dan coba lagi.'], 422);
        }

        if (!$isPaid && !$canAddBeforePayment) {
            return response()->json(['message' => 'Fasilitas tambahan hanya dapat ditambahkan sebelum pembayaran atau setelah pesanan aktif.'], 422);
        }

        $validated = $request->validate([
            'addon_ids'   => 'required|array',
            'addon_ids.*' => 'exists:addons,id',
        ]);

        $existingAddonIds = $booking->addons()->pluck('addons.id')->all();
        $addons = \App\Models\Addon::whereIn('id', $validated['addon_ids'])
            ->whereNotIn('id', $existingAddonIds)
            ->get();

        if ($addons->isEmpty()) {
            return response()->json(['message' => 'Fasilitas yang dipilih sudah ada pada pesanan ini.'], 422);
        }

        $syncData = [];
        $addedTotal = 0;

        foreach ($addons as $addon) {
            $syncData[$addon->id] = [
                'price_at_booking' => $addon->harga,
                'status'           => $isPaid ? 'pending' : 'confirmed',
            ];
            $addedTotal += (float) $addon->harga;
        }

        $booking->addons()->syncWithoutDetaching($syncData);

        if ($isPaid) {
            // Booking sudah lunas: addon baru perlu pembayaran terpisah.
            \App\Models\Notification::create([
                'title'   => 'Permintaan Fasilitas Baru',
                'message' => "Pesanan #{$booking->id} meminta tambahan fasilitas. Menunggu pembayaran fasilitas tambahan.",
                'user_id' => null,
                'link'    => "/admin/pemesanan/{$booking->id}"
            ]);
        } else {
            // Booking belum dibayar: addon langsung masuk ke total pembayaran utama.
            $booking->increment('total_harga', $addedTotal);
            $booking->increment('total_addon_price', $addedTotal);
            $booking->update([
                'payment_status' => 'Pending',
                'midtrans_order_id' => null,
                'midtrans_snap_token' => null,
                'midtrans_payment_type' => null,
            ]);
        }

        $booking->refresh();
        return response()->json($booking->load('addons', 'office'));
    }

    public function confirmAddon(Request $request, int $id)
    {
        $booking = Booking::find($id);
        if (!$booking) return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);

        $validated = $request->validate([
            'addon_id' => 'required|exists:addons,id',
        ]);

        // Update status di pivot table
        $addon = $booking->addons()->where('addon_id', $validated['addon_id'])->first();
        
        if ($addon && $addon->pivot->status === 'pending') {
            $booking->addons()->updateExistingPivot($validated['addon_id'], ['status' => 'confirmed']);
            
            // Baru sekarang update total harganya
            $price = $addon->pivot->price_at_booking;
            $booking->increment('total_harga', $price);
            $booking->increment('total_addon_price', $price);

            // Notif ke USER
            \App\Models\Notification::create([
                'title'   => 'Fasilitas Dikonfirmasi',
                'message' => "Fasilitas {$addon->nama} untuk pesanan #{$booking->id} telah aktif.",
                'user_id' => $booking->user_id,
                'link'    => "/pesanan-saya/{$booking->id}"
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function destroy(int $id)
    {
        $user = Auth::user();
        $booking = Booking::find($id);

        if ($booking) {
            // Cek kepemilikan sebelum hapus (Kecuali Admin & Helpdesk)
            if (!in_array(strtolower($user->role), ['admin', 'helpdesk']) && $booking->user_id !== $user->id) {
                return response()->json(['message' => 'Akses ditolak'], 403);
            }
            $deletedBooking = clone $booking;
            $booking->delete();
            // Invalidate cache terkait booking saja, tanpa menghapus semua cache aplikasi.
            $this->invalidateBookingCaches($deletedBooking);
        }
        return response()->json(['message' => 'Pesanan berhasil dihapus']);
    }
}
