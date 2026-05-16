<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Office;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AnalyticsController extends Controller
{
    public function getStats()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // 1. Summary Cards
        // Dalam alur manual, status Dikonfirmasi atau Selesai berarti pembayaran sudah diterima
        $totalRevenue = Booking::whereIn('status', ['Dikonfirmasi', 'Selesai'])->sum('total_harga');
        $activeBookings = Booking::where('status', 'Dikonfirmasi')->count();
        $totalRooms = Office::count();
        $totalUsers = \App\Models\User::where('role', 'user')->count();

        // 2. Revenue per Month (Last 6 months)
        $revenueData = Booking::whereIn('status', ['Dikonfirmasi', 'Selesai'])
            ->select(
                DB::raw('SUM(total_harga) as total'),
                DB::raw("DATE_FORMAT(created_at, '%b') as month"), // %b untuk Jan, Feb, dst
                DB::raw('MONTH(created_at) as month_num')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month', 'month_num')
            ->orderBy('month_num')
            ->get();

        // 3. Most Popular Rooms
        $popularRooms = Office::withCount('bookings')
            ->orderBy('bookings_count', 'desc')
            ->take(5)
            ->get()
            ->map(function($office) {
                return [
                    'name' => $office->nama,
                    'bookings' => $office->bookings_count
                ];
            });

        // 4. Status Distribution
        $statusStats = Booking::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        return response()->json([
            'summary' => [
                'revenue' => $totalRevenue,
                'activeBookings' => $activeBookings,
                'totalRooms' => $totalRooms,
                'totalUsers' => $totalUsers
            ],
            'revenueChart' => $revenueData,
            'popularRooms' => $popularRooms,
            'statusStats' => $statusStats
        ]);
    }
}
