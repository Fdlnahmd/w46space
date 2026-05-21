<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'sender_id',
        'sender_type',
        'content',
        'is_read_admin',
    ];

    protected $casts = [
        'is_read_admin' => 'boolean',
    ];

    public function session()
    {
        return $this->belongsTo(ChatSession::class, 'session_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
