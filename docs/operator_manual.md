# 👥 Operator & Admin Manual - Wisma 46 Space

Dokumen ini adalah panduan operasional standar (*SOP - Standard Operating Procedure*) bagi staf **Helpdesk** dan **Administrator** untuk mengelola layanan harian pada platform **Wisma 46 Space**.

---

## 🎧 Bagian 1: Panduan Operasional Helpdesk (Staf)

Staf Helpdesk berfokus pada komunikasi langsung dengan pelanggan, bantuan operasional *live chat*, dan verifikasi administrasi pemesanan.

### 1.1 Mengelola Live Chat Bantuan Pelanggan
Sistem obrolan menggunakan metode hibrida: pelanggan awalnya akan dilayani oleh **Virtual Assistant AI**. Jika AI mendeteksi masalah rumit atau atas permintaan user, sesi obrolan akan dialihkan ke manusia (*Helpdesk*).

1. **Notifikasi Eskalasi**: 
   * Saat chatbot virtual menambahkan tag eskalasi `[REQUEST_HUMAN]`, obrolan akan muncul di list aktif dashboard Live Chat Helpdesk dengan indikator status menunggu bantuan manusia.
2. **Memulai Interaksi**:
   * Buka panel **Live Chat** di dashboard Helpdesk.
   * Pilih sesi pengguna yang aktif. Ketik pesan sambutan yang ramah dan solutif.
   * *Catatan*: Sistem secara dinamis menampilkan nama asli dan peran (*role*) Anda di sisi pelanggan sebagai penanda kredibilitas layanan.
3. **Menyelesaikan Obrolan**:
   * Jika solusi sudah diberikan, klik tombol **Tutup Sesi (Close Session)** agar AI chatbot mengambil alih kembali percakapan di masa depan.

### 1.2 Verifikasi Status Pemesanan (Bookings)
Helpdesk memiliki wewenang untuk memeriksa berkas pemesanan:
* Masuk ke menu **Daftar Pemesanan**.
* Gunakan kolom pencarian untuk melacak ID booking atau nama pemesan.
* Periksa kesesuaian tanggal mulai kontrak, tanggal berakhir, dan durasi sewa yang dipilih oleh pelanggan.

---

## 🔑 Bagian 2: Panduan Operasional Administrator (Super User)

Administrator memiliki kendali penuh atas konfigurasi sistem, data ruangan, skema promo, finansial, dan konten publik.

### 2.1 Manajemen Ruangan (CRUD Ruangan)
Langkah menambahkan aset kantor baru di Wisma 46:
1. Buka menu **Kelola Ruangan** -> Klik **Tambah Ruangan**.
2. **Formulir Input**:
   * **Nama Ruangan**: Contoh: *"Executive Private Office Room 46A"*.
   * **Kategori**: Pilih dari opsi *Office*, *Private Office*, *Meeting Room*, *Coworking Space*, atau *Creative Space*.
   * **Harga Sewa**: Masukkan nominal harian (sistem otomatis mengalikan dengan 26 hari kerja per bulan di ringkasan).
   * **Kapasitas**: Jumlah maksimal orang.
   * **Deskripsi**: Deskripsikan fasilitas fisik ruangan.
   * **Fasilitas (Tagging)**: Masukkan fasilitas bawaan gratis (AC, Whiteboard, Proyektor, dll).
   * **Unggah Gambar**: Pilih gambar fisik ruangan dengan format optimal (.jpg / .png).
3. Klik **Simpan**. Sistem secara otomatis membersihkan cache global (`Cache::flush()`) agar ruangan baru langsung tampil di halaman depan user!

### 2.2 Persetujuan Pemesanan Sewa (Booking Approvals)
Penyewa baru yang mengajukan kontrak akan masuk dalam status **Pending**.
1. Buka menu **Manajemen Pemesanan**.
2. Klik **Detail** pada pesanan berstatus *Pending*.
3. Verifikasi rincian biaya (harga ruangan, addon terpilih, diskon promo).
4. Klik **Terima (Approve)** jika pembayaran manual atau kontrak kerja sama telah divalidasi.
   * *Efek Sistem*: Status berubah menjadi **Dikonfirmasi**, kalender ruangan otomatis ditandai sebagai terisi (*booked*), sisa masa kontrak mulai dihitung mundur secara real-time, dan berkas PDF **Invoice** otomatis diterbitkan.
5. Klik **Tolak (Reject / Cancel)** jika syarat pemesanan tidak terpenuhi.

### 2.3 Manajemen Kupon Promo
Administrator dapat membuat skema promosi dinamis guna meningkatkan konversi transaksi:
1. Buka menu **Kelola Kupon** -> Klik **Buat Kupon Baru**.
2. **Konfigurasi Kupon**:
   * **Kode Kupon**: Gunakan huruf kapital, contoh: `PROMO46`.
   * **Tipe Diskon**: Pilih `Persentase` (contoh: 10%) atau `Nominal` (contoh: Rp 500,000).
   * **Kuota Penggunaan**: Batasi berapa kali kupon dapat dipakai secara global.
   * **Tanggal Kadaluarsa**: Tanggal batas kupon otomatis tidak dapat digunakan lagi oleh sistem.
3. Klik **Simpan**.

### 2.4 Moderasi Testimoni & Ulasan (Reviews)
Untuk mencegah ulasan berbau spam, sara, atau tidak valid dari kompetitor:
1. Buka menu **Moderasi Ulasan**.
2. Tinjau ulasan bintang (1-5) dan komentar yang dikirim oleh pelanggan pasca masa sewa dikonfirmasi.
3. Klik ikon **Hapus (Delete)** pada ulasan yang melanggar kebijakan ulasan perusahaan untuk menghapusnya secara permanen dari halaman detail ruangan publik.
