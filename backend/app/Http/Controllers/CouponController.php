<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index()
    {
        return response()->json(Coupon::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|unique:coupons,code',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric',
            'expiry_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer'
        ]);

        $coupon = Coupon::create($validated);
        return response()->json($coupon, 201);
    }

    public function update(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);
        $validated = $request->validate([
            'code' => 'required|unique:coupons,code,' . $id,
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric',
            'expiry_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer'
        ]);

        $coupon->update($validated);
        return response()->json($coupon);
    }

    public function destroy($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();
        return response()->json(['message' => 'Kupon berhasil dihapus']);
    }

    public function check(Request $request)
    {
        $request->validate(['code' => 'required']);
        $coupon = Coupon::where('code', $request->code)->first();

        if (!$coupon) {
            return response()->json(['message' => 'Kode kupon tidak valid'], 404);
        }

        if ($coupon->expiry_date && $coupon->expiry_date < date('Y-m-d')) {
            return response()->json(['message' => 'Kupon sudah kadaluarsa'], 400);
        }

        if ($coupon->isLimitReached()) {
            return response()->json(['message' => 'Kuota kupon sudah habis'], 400);
        }

        return response()->json([
            'message' => 'Kupon berhasil diterapkan',
            'coupon' => $coupon
        ]);
    }
}
