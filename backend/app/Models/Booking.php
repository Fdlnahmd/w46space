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
        'nama_pemesan',
        'perusahaan',
        'tanggal_mulai',
        'tanggal_akhir',
        'durasi',
        'waktu_mulai',
        'waktu_selesai',
        'total_harga',
        'status',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_akhir' => 'date',
        'total_harga' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function office()
    {
        return $this->belongsTo(Office::class);
    }
}
