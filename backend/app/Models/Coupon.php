<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'expiry_date',
        'usage_limit',
        'used_count',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'value' => 'float',
    ];

    public function isExpired()
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function isLimitReached()
    {
        return $this->usage_limit !== null && $this->used_count >= $this->usage_limit;
    }
}
