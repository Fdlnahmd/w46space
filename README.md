# 🏢 Sewa Ruang - Office Booking Platform

**Sewa Ruang** adalah platform modern berbasis web untuk menyewa berbagai jenis ruang kerja, mulai dari Private Office, Coworking Space, hingga Meeting Room eksklusif. Aplikasi ini dirancang untuk memberikan pengalaman pemesanan yang cepat, transparan, dan efisien bagi pengguna maupun admin.

---

## 🚀 Fitur Utama

### 👤 Untuk Pengguna (Penyewa)

- **Daftar Ruangan**: Telusuri berbagai jenis ruangan dengan kategori yang lengkap.
- **Ruangan Populer**: Akses cepat ke ruangan-ruangan terbaik yang paling banyak diminati.
- **Booking System & Addons**: Pesan ruangan dengan opsi fasilitas tambahan (WiFi, Kopi, dll) dengan penanganan state kosong yang informatif.
- **Promo & Kupon**: Gunakan kode diskon (persentase/nominal) untuk harga lebih hemat.
- **Riwayat & Invoice**: Pantau status pesanan dan unduh invoice resmi dalam format PDF.
- **Perpanjang Kontrak**: Fitur sekali klik untuk memperpanjang masa sewa ruangan.
- **Ulasan & Rating**: Berikan testimoni dan bintang setelah pesanan dikonfirmasi.
- **Profil & Keamanan**: Kelola data diri dan fitur lupa password via SMTP dengan tombol kembali ke Landing Page yang ramah mobile.

### 🔐 Untuk Admin

- **Robust Dashboard**: Statistik pendapatan, jumlah pesanan, dan ruangan secara real-time.
- **Manajemen Ruangan**: Tambah, edit, dan hapus data ruangan (CRUD) beserta gambar.
- **Manajemen Pemesanan**: Kelola alur konfirmasi dan pembatalan pesanan secara efisien.
- **Sistem Kupon**: Buat dan kelola kode promo dengan limit penggunaan dan tanggal kadaluarsa.
- **Moderasi Ulasan**: Kontrol testimoni pengguna untuk menjaga kualitas platform.

### 📱 Keunggulan & Stabilisasi UX Modern

- **Mobile Card-List Layout**: Menggantikan tabel horizontal tradisional pada resolusi ponsel dengan **Daftar Kartu Informasi** vertikal otomatis. Tidak perlu menggeser (swipe-X) layar lagi di perangkat ponsel!
- **Bulletproof Redirection (Anti-Crash)**: Penanganan data `404 Not Found` yang tangguh pada detail pesanan. Menghindari crash atau loading tak terbatas (*"Memuat..."*) jika mengakses pesanan yang telah dihapus melalui tautan notifikasi lama.
- **Sistem Notifikasi Cerdas & Modal Popup**: Admin dan pengguna akan menerima modal pemberitahuan informatif jika diarahkan kembali karena tautan pesanan usang.
- **Aksi Tombol Konsisten**: Penggunaan standar tombol aksi outline lingkaran berukuran tetap (`36px` × `36px`) baik untuk opsi edit/detail (`.btn-outline`) maupun hapus (`.btn-outline-danger`) untuk menghindari asimetris layout.
- **Navbar Terpadu**: Tombol Bell Notifikasi dan Theme Switcher berdimensi presisi (`42px` × `42px`) dengan perataan tengah ikon yang sempurna.

---

## 🛠️ Teknologi yang Digunakan

| Komponen             | Teknologi                                  |
| :------------------- | :----------------------------------------- |
| **Frontend**         | React.js (Vite), Lucide Icons, Vanilla CSS |
| **Backend**          | Laravel 11 (RESTful API)                   |
| **Database**         | MySQL (with **Navicat** as GUI)            |
| **Containerization** | Docker & Docker Compose                    |
| **State Management** | React Context API                          |

---

## 📦 Instalasi (Menggunakan Docker)

Pastikan Anda sudah menginstal **Docker Desktop**, **Docker Compose**, dan **WSL (Windows Subsystem for Linux)** di perangkat Anda agar Docker dapat berjalan dengan lancar (khusus pengguna Windows).

1.  **Clone Repository**

    ```bash
    git clone https://github.com/Fdlnahmd/office-rent.git
    cd office-rent
    ```

2.  **Jalankan Container**

    ```bash
    docker-compose up -d --build
    ```

3.  **Persiapan Database & Data Testing (Seeding)**

    ```bash
    docker-compose exec backend php artisan migrate:fresh --seed
    ```

    > [!TIP]
    > Untuk mengaktifkan fitur **Lupa Password**, pastikan Anda telah mengonfigurasi `MAIL_USERNAME` dan `MAIL_PASSWORD` di file `.env` menggunakan akun SMTP (seperti Gmail App Password).

4.  **Akses Aplikasi**
    - **Frontend**: [http://localhost:5173](http://localhost:5173)
    - **Backend API**: [http://localhost:8000](http://localhost:8000)

---

## 🔑 Akun Demo (Default Seeder)

| Role      | Email               | Password |
| :-------- | :------------------ | :------- |
| **Admin** | admin@sewaruang.com | password |
| **User**  | budi@gmail.com      | password |

---

## 📐 Arsitektur & Alur Kerja

Platform ini dilengkapi dengan pemetaan arsitektur lengkap yang dapat Anda lihat pada direktori `docs/`.

### 🎭 Use Case Diagram
![Use Case Diagram](docs/Use%20Case%20Diagram.png)

### 🌊 Flowchart: Alur Pemesanan Ruangan
![Alur Pemesanan Ruangan](docs/Flowchart%20Pemesanan%20Ruangan.png)

### 📊 Flowchart: Alur Kelola Admin
![Alur Kelola Admin](docs/Flowchart%20Kelola%20Admin.png)

### 🗺️ Peta Navigasi Halaman (Web Sitemap)
![Peta Navigasi Halaman](docs/Flowchart%20Web%20Sewa%20Ruang.png)

Detail lebih lanjut dan kode Mermaid interaktif dapat dilihat pada dokumentasi internal:
👉 [diagram_arsitektur.md](docs/diagram_arsitektur.md)

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

_Dibuat dengan ❤️ oleh Fadlan Achmad Frizal_
