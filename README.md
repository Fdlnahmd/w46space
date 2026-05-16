# 🏢 Sewa Ruang - Office Booking Platform

**Sewa Ruang** adalah platform modern berbasis web untuk menyewa berbagai jenis ruang kerja, mulai dari Private Office, Coworking Space, hingga Meeting Room eksklusif. Aplikasi ini dirancang untuk memberikan pengalaman pemesanan yang cepat, transparan, dan efisien bagi pengguna maupun admin.

---

## 🚀 Fitur Utama

### 👤 Untuk Pengguna (Penyewa)

- **Daftar Ruangan**: Telusuri berbagai jenis ruangan dengan kategori yang lengkap.
- **Ruangan Populer**: Akses cepat ke ruangan-ruangan terbaik yang paling banyak diminati.
- **Booking System & Addons**: Pesan ruangan dengan opsi fasilitas tambahan (WiFi, Kopi, dll).
- **Promo & Kupon**: Gunakan kode diskon (persentase/nominal) untuk harga lebih hemat.
- **Riwayat & Invoice**: Pantau status pesanan dan unduh invoice resmi dalam format PDF.
- **Perpanjang Kontrak**: Fitur sekali klik untuk memperpanjang masa sewa ruangan.
- **Ulasan & Rating**: Berikan testimoni dan bintang setelah pesanan dikonfirmasi.
- **Profil & Keamanan**: Kelola data diri dan fitur lupa password via SMTP.

### 🔐 Untuk Admin

- **Robust Dashboard**: Statistik pendapatan, jumlah pesanan, dan ruangan secara real-time.
- **Manajemen Ruangan**: Tambah, edit, dan hapus data ruangan (CRUD) beserta gambar.
- **Manajemen Pemesanan**: Kelola alur konfirmasi dan pembatalan pesanan secara efisien.
- **Sistem Kupon**: Buat dan kelola kode promo dengan limit penggunaan dan tanggal kadaluarsa.
- **Moderasi Ulasan**: Kontrol testimoni pengguna untuk menjaga kualitas platform.

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

### Use Case Diagram

![Use Case Diagram](docs/Usecase%20Diagram.png)

### Flowchart: Alur Pemesanan

![Flowchart Alur Pemesanan](docs/Flowchart%20Diagram.png)

Detail lebih lanjut mengenai arsitektur dapat dilihat pada dokumentasi internal:
👉 `docs/diagram_arsitektur.md`

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

_Dibuat dengan ❤️ oleh Fadlan Achmad Frizal_
