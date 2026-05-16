<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $booking->id }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.6; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
        .invoice-details { text-align: right; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .total-row { font-weight: bold; font-size: 18px; color: #2563eb; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .status-paid { color: #059669; font-weight: bold; text-transform: uppercase; border: 2px solid #059669; padding: 5px 10px; display: inline-block; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div style="margin-bottom: 30px;">
            <table style="border: none;">
                <tr style="border: none;">
                    <td style="border: none; width: 50%;">
                        <div class="logo">Sewa Ruang</div>
                        <p style="font-size: 12px; color: #64748b;">
                            Jl. Perkantoran Modern No. 123<br>
                            Jakarta Selatan, Indonesia<br>
                            support@sewaruang.com
                        </p>
                    </td>
                    <td style="border: none; text-align: right; width: 50%;">
                        <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">INVOICE</div>
                        <p style="font-size: 14px; margin: 0;">No: {{ $invoice_no }}</p>
                        <p style="font-size: 14px; margin: 0;">Tanggal: {{ $date }}</p>
                        @if($booking->payment_status === 'Paid')
                            <div class="status-paid" style="margin-top: 10px;">LUNAS</div>
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <div class="section-title">Informasi Penyewa</div>
        <table style="margin-bottom: 40px;">
            <tr style="border: none;">
                <td style="border: none; width: 50%;">
                    <strong>Nama:</strong><br>
                    {{ $booking->nama_pemesan }}
                </td>
                <td style="border: none; width: 50%;">
                    <strong>Perusahaan:</strong><br>
                    {{ $booking->perusahaan ?: '-' }}
                </td>
            </tr>
        </table>

        <div class="section-title">Detail Pemesanan</div>
        <table>
            <thead>
                <tr>
                    <th>Deskripsi</th>
                    <th>Detail</th>
                    <th style="text-align: right;">Harga</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Sewa Ruangan: {{ $booking->office->nama ?? 'Ruangan' }}</strong></td>
                    <td>
                        {{ $booking->durasi }} Bulan 
                        ({{ $booking->tanggal_mulai ? $booking->tanggal_mulai->format('d/m/Y') : '-' }} - 
                         {{ $booking->tanggal_akhir ? $booking->tanggal_akhir->format('d/m/Y') : '-' }})
                    </td>
                    <td style="text-align: right;">Rp {{ number_format($booking->office_price_total ?: ($booking->total_harga - $booking->total_addon_price + $booking->discount_amount), 0, ',', '.') }}</td>
                </tr>
                @if($booking->addons)
                    @foreach($booking->addons as $addon)
                    <tr>
                        <td>Layanan Tambahan: {{ $addon->nama }}</td>
                        <td>{{ ($addon->pivot && $addon->pivot->status === 'confirmed') ? 'Aktif' : 'Menunggu Konfirmasi' }}</td>
                        <td style="text-align: right;">Rp {{ number_format($addon->pivot->price_at_booking ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    @endforeach
                @endif
                
                @if($booking->discount_amount > 0)
                <tr style="color: #dc2626;">
                    <td colspan="2">Potongan Diskon ({{ $booking->coupon->code ?? 'Kupon' }})</td>
                    <td style="text-align: right;">- Rp {{ number_format($booking->discount_amount, 0, ',', '.') }}</td>
                </tr>
                @endif

                <tr class="total-row">
                    <td colspan="2" style="text-align: right;">TOTAL BAYAR</td>
                    <td style="text-align: right;">Rp {{ number_format($booking->total_harga, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <p>Terima kasih telah mempercayakan kebutuhan kantor Anda kepada Sewa Ruang.</p>
            <p>Invoice ini diterbitkan secara otomatis dan sah tanpa tanda tangan basah.</p>
        </div>
    </div>
</body>
</html>
