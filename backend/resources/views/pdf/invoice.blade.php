<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice_no }} - Wisma 46 Space</title>

    @php
    $possiblePaths = [
        '/var/www/w46space/backend/public/images/invoice-header.png',
        public_path('images/invoice-header.png'),
        base_path('public/images/invoice-header.png'),
        base_path('backend/public/images/invoice-header.png'),
    ];
    $resolvedPath = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $resolvedPath = $path;
            break;
        }
    }
    $headerImage = $resolvedPath
        ? 'data:image/png;base64,' . base64_encode(file_get_contents($resolvedPath))
        : null;
    @endphp

    <style>
        @page {
            margin: 0;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1a202c;
            line-height: 1.35;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }

        .page {
            width: 100%;
            background: #ffffff;
        }

        /* ── Header ─────────────────────────────── */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            background: #1e40af url('{{ $headerImage }}') no-repeat center center;
            background-size: cover;
            margin: 0;
            padding: 0;
            border: none;
        }

        .header-left {
            padding: 26px 36px;
            color: #ffffff;
            vertical-align: top;
            background-color: rgba(15, 50, 130, 0.65);
        }

        .header-right {
            padding: 26px 36px;
            color: #ffffff;
            text-align: right;
            vertical-align: top;
            background-color: rgba(15, 50, 130, 0.65);
        }

        .brand-name {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
        }

        .brand-sub {
            font-size: 11px;
            color: #93c5fd;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 2px;
        }

        .brand-address {
            font-size: 11px;
            color: #cbd5e1;
            margin-top: 4px;
            line-height: 1.6;
        }

        .invoice-label {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 2px;
        }

        .invoice-meta-text {
            font-size: 12px;
            color: #cbd5e1;
            margin-top: 6px;
        }

        .invoice-meta-text strong {
            color: #ffffff;
        }

        .status-badge {
            display: inline-block;
            margin-top: 4px;
            padding: 4px 14px;
            border: 2px solid #4ade80;
            color: #4ade80;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 1px;
            text-align: center;
        }

        .status-badge-pending {
            display: inline-block;
            margin-top: 4px;
            padding: 4px 14px;
            border: 2px solid #fbbf24;
            color: #fbbf24;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 1px;
            text-align: center;
        }

        /* ── Body ───────────────────────────────── */
        .body {
            padding: 26px 36px 22px;
        }

        .section-label {
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #1e40af;
            margin-bottom: 8px;
        }

        /* Tenant Info Table */
        .tenant-table {
            width: 100%;
            border-collapse: collapse;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            margin-bottom: 14px;
        }

        .tenant-cell {
            width: 33.33%;
            padding: 12px 16px;
            vertical-align: top;
        }

        .tenant-cell .label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 4px;
        }

        .tenant-cell .value {
            font-size: 14px;
            font-weight: bold;
            color: #1a202c;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .items-table th {
            background: #f8fafc;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            padding: 9px 12px;
            border-bottom: 2px solid #e2e8f0;
            text-align: left;
        }

        .items-table th.text-right {
            text-align: right;
        }

        .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
            color: #374151;
            vertical-align: top;
        }

        .items-table td.text-right {
            text-align: right;
        }

        .row-addon td {
            color: #64748b;
            font-size: 12px;
        }

        .row-discount td {
            color: #dc2626;
            font-size: 13px;
        }

        /* Total Block Table */
        .total-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 14px;
        }

        .total-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            padding: 12px 16px;
            text-align: right;
        }

        .total-label {
            font-size: 13px;
            font-weight: bold;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 20px;
        }

        .total-amount {
            font-size: 22px;
            font-weight: bold;
            color: #1e40af;
        }

        /* Payment info */
        .payment-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 12px 16px;
            margin-top: 10px;
        }

        .payment-box .pay-label {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #16a34a;
            margin-bottom: 8px;
        }

        .payment-box p {
            font-size: 12px;
            color: #374151;
            margin-bottom: 4px;
        }

        .payment-box strong {
            color: #1a202c;
        }

        /* Footer */
        .footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 14px 36px;
            text-align: center;
        }

        .footer p {
            font-size: 11px;
            color: #94a3b8;
            margin-bottom: 4px;
        }

        .footer .contact {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
        }
    </style>
</head>

<body>
    <div class="page">

        @php
        $lang = $lang ?? 'id';
        @endphp

        <!-- HEADER -->
        <table class="header-table">
            <tr>
                <td class="header-left">
                    <div class="brand-name">Wisma 46 Space</div>
                    <div class="brand-sub">Kota BNI Jakarta</div>
                    <div class="brand-address">
                        Jl. Jend. Sudirman Kav. 1, Jakarta 10220<br>
                        info@wisma46space.com &nbsp;·&nbsp; (021) 0000-0000
                    </div>
                </td>
                <td class="header-right">
                    <div class="invoice-label">INVOICE</div>
                    <div class="invoice-meta-text">No: <strong>{{ $invoice_no }}</strong></div>
                    <div class="invoice-meta-text">{{ $lang === 'en' ? 'Date:' : 'Tanggal:' }} <strong>{{ $date }}</strong></div>
                    <div class="status-badge">{{ $lang === 'en' ? 'PAID' : 'LUNAS' }}</div>
                </td>
            </tr>
        </table>

        <!-- BODY -->
        <div class="body">

            <!-- Tenant Info -->
            <div class="section-label">{{ $lang === 'en' ? 'Tenant Information' : 'Informasi Penyewa' }}</div>
            <table class="tenant-table">
                <tr>
                    <td class="tenant-cell" style="border-right: 1px solid #e2e8f0;">
                        <div class="label">{{ $lang === 'en' ? 'Full Name' : 'Nama Lengkap' }}</div>
                        <div class="value">{{ $booking->nama_pemesan }}</div>
                    </td>
                    <td class="tenant-cell" style="border-right: 1px solid #e2e8f0;">
                        <div class="label">{{ $lang === 'en' ? 'Company' : 'Perusahaan' }}</div>
                        <div class="value">{{ $booking->perusahaan ?: '—' }}</div>
                    </td>
                    <td class="tenant-cell">
                        <div class="label">{{ $lang === 'en' ? 'Booking Status' : 'Status Pesanan' }}</div>
                        <div class="value">
                            {{ $lang === 'en' ? (['Pending' => 'Pending', 'Dikonfirmasi' => 'Confirmed', 'Selesai' => 'Completed', 'Dibatalkan' => 'Cancelled'][$booking->status] ?? $booking->status) : $booking->status }}
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Detail Pemesanan -->
            <div class="section-label">{{ $lang === 'en' ? 'Booking Details' : 'Detail Pemesanan' }}</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width:45%">{{ $lang === 'en' ? 'Description' : 'Deskripsi' }}</th>
                        <th style="width:30%">{{ $lang === 'en' ? 'Period' : 'Periode' }}</th>
                        <th style="width:25%" class="text-right">{{ $lang === 'en' ? 'Price' : 'Harga' }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>{{ $booking->office->nama ?? 'Ruangan' }}</strong><br>
                            <span style="font-size:11px;color:#64748b;">
                                Wisma 46, Gedung Tower &nbsp;·&nbsp; {{ $booking->office->kategori ?? '' }}
                            </span>
                        </td>
                        <td>
                            {{ $booking->durasi }} {{ $lang === 'en' ? 'Month(s)' : 'Bulan' }}<br>
                            <span style="font-size:11px;color:#64748b;">
                                {{ $booking->tanggal_mulai ? ($lang === 'en' ? $booking->tanggal_mulai->locale('en')->isoFormat('DD MMM YYYY') : $booking->tanggal_mulai->locale('id')->isoFormat('DD MMM YYYY')) : '-' }}
                                –
                                {{ $booking->tanggal_akhir ? ($lang === 'en' ? $booking->tanggal_akhir->locale('en')->isoFormat('DD MMM YYYY') : $booking->tanggal_akhir->locale('id')->isoFormat('DD MMM YYYY')) : '-' }}
                            </span>
                        </td>
                        <td class="text-right">Rp {{ number_format($booking->office_price_total ?: ($booking->total_harga - $booking->total_addon_price + $booking->discount_amount), 0, ',', '.') }}</td>
                    </tr>

                    @if($booking->addons)
                    @foreach($booking->addons as $addon)
                    <tr class="row-addon">
                        <td>
                            Add-on: <strong>{{ $addon->nama }}</strong>
                        </td>
                        <td>
                            {{ ($addon->pivot && $addon->pivot->status === 'confirmed') ? ($lang === 'en' ? 'Active' : 'Aktif') : ($lang === 'en' ? 'Awaiting Confirmation' : 'Menunggu Konfirmasi') }}
                        </td>
                        <td class="text-right">Rp {{ number_format($addon->pivot->price_at_booking ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    @endforeach
                    @endif

                    @if($booking->discount_amount > 0)
                    <tr class="row-discount">
                        <td colspan="2">{{ $lang === 'en' ? 'Coupon Discount:' : 'Diskon Kupon:' }} <strong>{{ $booking->coupon->code ?? 'Kupon' }}</strong></td>
                        <td class="text-right">- Rp {{ number_format($booking->discount_amount, 0, ',', '.') }}</td>
                    </tr>
                    @endif
                </tbody>
            </table>

            <!-- Total Table -->
            <table class="total-table">
                <tr>
                    <td style="width: 50%;"></td>
                    <td style="width: 50%;" class="total-box">
                        <span class="total-label">{{ $lang === 'en' ? 'Total Payment' : 'Total Pembayaran' }}</span>
                        <span class="total-amount">Rp {{ number_format($booking->total_harga, 0, ',', '.') }}</span>
                    </td>
                </tr>
            </table>

            <!-- Payment Info -->
            <div class="payment-box">
                <div class="pay-label">{{ $lang === 'en' ? 'Payment Information' : 'Informasi Pembayaran' }}</div>
                @if($booking->midtrans_payment_type)
                <p>{{ $lang === 'en' ? 'Payment Method:' : 'Metode Pembayaran:' }} <strong>{{ strtoupper($booking->midtrans_payment_type) }}</strong></p>
                @endif
                @if($booking->paid_at)
                <p>{{ $lang === 'en' ? 'Payment Time:' : 'Waktu Pembayaran:' }} <strong>{{ $booking->paid_at->locale($lang === 'en' ? 'en' : 'id')->isoFormat('DD MMMM YYYY, HH:mm') }} WIB</strong></p>
                @endif
                <p style="margin-top: 4px; font-size: 11px; color: #4b5563;">
                    {{ $lang === 'en' ? 'For payment inquiries, please contact:' : 'Untuk pertanyaan pembayaran, silakan hubungi:' }} 
                    <strong>WhatsApp 0812 3456 7890</strong> (Admin) &nbsp;·&nbsp; <strong>info@wisma46space.com</strong>
                </p>
            </div>

        </div>

        <!-- FOOTER -->
        <div class="footer">
            <p>{{ $lang === 'en' ? 'Thank you for choosing' : 'Terima kasih telah memilih' }} <strong>Wisma 46 Space</strong>{{ $lang === 'en' ? ' as your premium workspace solution.' : ' sebagai solusi ruang kerja premium Anda.' }}</p>
            <p>{{ $lang === 'en' ? 'This invoice is generated automatically and is valid without physical signature.' : 'Invoice ini diterbitkan secara otomatis dan sah tanpa tanda tangan basah.' }}</p>
            <div class="contact">
                Wisma 46 · Jl. Jend. Sudirman Kav. 1, Jakarta 10220 · (021) 0000-0000 · info@wisma46space.com
            </div>
        </div>

    </div>
</body>

</html>