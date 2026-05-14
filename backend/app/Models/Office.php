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
    ];

    protected $casts = [
        'fasilitas' => 'array',
        'harga' => 'float',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
