<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'kategori',
        'kapasitas',
        'harga',
        'fasilitas',
        'deskripsi',
        'gambar',
        'status',
        'is_popular',
    ];

    protected $casts = [
        'fasilitas' => 'array',
        'harga' => 'float',
        'is_popular' => 'boolean',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
