<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->query('per_page', 15);
        
        $query = Booking::with('office', 'user', 'addons')->orderBy('created_at', 'desc');

        if (strtolower($user->role) !== 'admin') {
            $query->where('user_id', $user->id);
        }

        return response()->json($query->paginate($perPage));
    }

    public function show(int $id)
    {
        $user = Auth::user();
        $booking = Booking::with(['office', 'addons'])->find($id);

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
            'parent_id'      => 'nullable|exists:bookings,id',
            'nama_pemesan'   => 'required|string',
            'perusahaan'     => 'nullable|string',
            'tanggal_mulai'  => 'required|date',
            'tanggal_akhir'  => 'required|date',
            'waktu_mulai'    => 'required',
            'waktu_selesai'  => 'required',
            'durasi'         => 'required|integer',
            'total_harga'    => 'required|numeric',
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

            $finalTotal = $basePrice + $totalAddonPrice - $discountAmount;

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

            \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');

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

        // Hanya admin yang bisa update detail pesanan lewat sini (biasanya status)
        if (strtolower($user->role) !== 'admin' && $booking->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $data = $request->all();
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
        if ($booking) {
            $oldStatus = $booking->status;
            $newStatus = $request->status;
            $booking->update(['status' => $newStatus]);
            
            // Create notification for User
            \App\Models\Notification::create([
                'user_id' => $booking->user_id,
                'title'   => "Status Pesanan #{$booking->id} Berubah",
                'message' => "Pesanan Anda untuk {$booking->office->nama} sekarang berstatus: {$newStatus}.",
                'type'    => $newStatus === 'Dikonfirmasi' ? 'success' : ($newStatus === 'Dibatalkan' ? 'danger' : 'info'),
                'link'    => "/pesanan-saya/{$booking->id}"
            ]);

            // Invalidate office listing and analytics cache
            \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
            \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
            \Illuminate\Support\Facades\Cache::flush();
        }
        return response()->json($booking);
    }

    public function addAddons(Request $request, int $id)
    {
        $booking = Booking::find($id);
        if (!$booking) return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);

        $validated = $request->validate([
            'addon_ids'   => 'required|array',
            'addon_ids.*' => 'exists:addons,id',
        ]);

        $addons = \App\Models\Addon::whereIn('id', $validated['addon_ids'])->get();
        $syncData = [];

        foreach ($addons as $addon) {
            // Set status PENDING untuk addon baru (agar tidak langsung update total harga)
            $syncData[$addon->id] = [
                'price_at_booking' => $addon->harga,
                'status'           => 'pending'
            ];
        }

        $booking->addons()->syncWithoutDetaching($syncData);
        
        // Buat notifikasi untuk ADMIN
        \App\Models\Notification::create([
            'title'   => 'Permintaan Fasilitas Baru',
            'message' => "Pesanan #{$booking->id} meminta tambahan fasilitas. Segera konfirmasi pembayaran.",
            'user_id' => null, // Untuk admin
            'link'    => "/admin/pemesanan/{$booking->id}"
        ]);

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
            // Cek kepemilikan sebelum hapus
            if (strtolower($user->role) !== 'admin' && $booking->user_id !== $user->id) {
                return response()->json(['message' => 'Akses ditolak'], 403);
            }
            $booking->delete();
            // Invalidate office listing and analytics cache
            \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
            \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
            \Illuminate\Support\Facades\Cache::flush();
        }
        return response()->json(['message' => 'Pesanan berhasil dihapus']);
    }
}
