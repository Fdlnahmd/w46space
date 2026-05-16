<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Addon extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'harga',
        'icon',
    ];

    protected $casts = [
        'harga' => 'float',
    ];

    public function bookings()
    {
        return $this->belongsToMany(Booking::class, 'booking_addons')
                    ->withPivot('price_at_booking')
                    ->withTimestamps();
    }
}
