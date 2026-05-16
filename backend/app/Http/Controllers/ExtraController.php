<?php

namespace App\Http\Controllers;

use App\Models\Addon;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExtraController extends Controller
{
    public function getAddons()
    {
        // Ambil yang unik berdasarkan nama agar tidak dobel di UI
        return response()->json(Addon::all()->unique('nama')->values());
    }

    public function getNotifications()
    {
        $user = Auth::user();
        if ($user->role === 'admin') {
            // Admin hanya melihat notifikasi sistem (untuk admin)
            return response()->json(Notification::whereNull('user_id')->latest()->take(20)->get());
        }
        // User hanya melihat notifikasi miliknya sendiri
        return response()->json(Notification::where('user_id', $user->id)->latest()->take(20)->get());
    }

    public function markAsRead(int $id)
    {
        $notif = Notification::find($id);
        if ($notif) {
            $notif->update(['is_read' => true]);
        }
        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        $user = Auth::user();
        if ($user->role === 'admin') {
            Notification::whereNull('user_id')->update(['is_read' => true]);
        } else {
            Notification::where('user_id', $user->id)->update(['is_read' => true]);
        }
        return response()->json(['success' => true]);
    }
}
