<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Atur Ulang Kata Sandi - Wisma 46 Space</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #334155; margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: none; -ms-text-size-adjust: none;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; margin: 0; padding: 40px 20px; width: 100%;">
        <tr>
            <td align="left">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto; width: 100%; text-align: left;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 0 0 24px; border-bottom: 1px solid #f1f5f9;">
                            <a href="{{ config('app.url') }}" style="font-size: 22px; font-weight: 800; color: #2563eb; text-decoration: none; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                🏢 Wisma 46 Space
                            </a>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 0;">
                            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Halo, {{ $name }}!</h1>
                            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di platform <strong>Wisma 46 Space</strong>.</p>
                            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 0; margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Silakan klik tombol di bawah ini untuk melanjutkan proses pembaruan kata sandi Anda:</p>

                            <!-- CTA Button -->
                            <div style="margin: 28px 0;">
                                <a href="{{ $url }}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.12), 0 2px 4px -1px rgba(37, 99, 235, 0.08);">
                                    Atur Ulang Kata Sandi
                                </a>
                            </div>

                            <!-- Expiry Info Box -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin-bottom: 28px;">
                                <p style="font-size: 14px; color: #475569; margin: 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                    <strong>Masa Berlaku:</strong> Tautan pengaturan ulang kata sandi ini hanya aktif selama <strong>60 menit</strong> demi menjaga keamanan akun Anda.
                                </p>
                            </div>

                            <p style="font-size: 14px; margin-bottom: 0; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Jika Anda tidak merasa mengajukan permintaan ini, silakan abaikan email ini. Kata sandi Anda akan tetap aman.</p>

                            <!-- Trouble URL -->
                            <div style="word-break: break-all; font-size: 12px; color: #94a3b8; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                Jika Anda mengalami kendala saat mengeklik tombol di atas, salin dan tempel tautan berikut ke browser Anda:<br />
                                <a href="{{ $url }}" style="color: #2563eb; text-decoration: none; word-break: break-all; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">{{ $url }}</a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 0 0; border-top: 1px solid #f1f5f9;">
                            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 6px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">&copy; {{ date('Y') }} Wisma 46 Space. All rights reserved.</p>
                            <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Kota BNI, Jl. Jend. Sudirman Kav. 1, Jakarta 10220</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
