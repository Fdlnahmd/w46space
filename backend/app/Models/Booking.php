<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Office;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'office_id',
        'parent_id',
        'nama_pemesan',
        'perusahaan',
        'tanggal_mulai',
        'tanggal_akhir',
        'durasi',
        'waktu_mulai',
        'waktu_selesai',
        'total_harga',
        'status',
        'payment_status',
        'payment_token',
        'coupon_id',
        'discount_amount',
        'total_addon_price',
        'midtrans_order_id',
        'midtrans_snap_token',
        'midtrans_payment_type',
        'paid_at',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_akhir' => 'date',
        'total_harga' => 'float',
        'discount_amount' => 'float',
        'total_addon_price' => 'float',
        'paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function addons()
    {
        return $this->belongsToMany(Addon::class, 'booking_addons')
                    ->withPivot('price_at_booking', 'status')
                    ->withTimestamps();
    }
}
