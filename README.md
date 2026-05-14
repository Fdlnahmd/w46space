# 🏢 Sewa Ruang - Office Booking Platform

**Sewa Ruang** adalah platform modern berbasis web untuk menyewa berbagai jenis ruang kerja, mulai dari **Private Office**, **Coworking Space**, hingga **Meeting Room** eksklusif. Aplikasi ini dirancang untuk memberikan pengalaman pemesanan yang cepat, transparan, dan efisien bagi pengguna maupun admin.

---

## 🚀 Fitur Utama

### 👤 Untuk Pengguna (Penyewa)

- **Daftar Ruangan**: Telusuri berbagai jenis ruangan dengan kategori yang lengkap.
- **Ruangan Populer**: Akses cepat ke ruangan-ruangan terbaik yang paling banyak diminati.
- **Pencarian & Filter**: Cari ruangan berdasarkan nama atau filter berdasarkan kategori (Office, Coworking, dll).
- **Booking System**: Pesan ruangan secara langsung dengan pengisian data yang mudah.
- **Riwayat Pesanan**: Pantau status dan detail pesanan yang telah dilakukan.
- **Profil Kustom**: Kelola data diri dan Password pengguna.

### 🔐 Untuk Admin

- **Dashboard Statistik**: Pantau ringkasan data ruangan dan pemesanan.
- **Manajemen Ruangan**: Tambah, edit, dan hapus data ruangan (CRUD).
- **Manajemen Pemesanan**: Kelola dan lihat detail semua pesanan yang masuk dari pengguna.
- **Kontrol Status**: Atur ketersediaan ruangan secara _real-time_.

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

![Use Case Diagram](docs/usecase%20diagram.png)

### Flowchart: Alur Pemesanan

![Flowchart Alur Pemesanan](docs/flowchart%20office-rent.png)

Detail lebih lanjut mengenai arsitektur dapat dilihat pada dokumentasi internal:
👉 `docs/diagram_arsitektur.md`

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

_Dibuat dengan ❤️ oleh Fadlan Achmad Frizal_
