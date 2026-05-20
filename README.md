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
| **Monitoring**       | Grafana, Prometheus, Loki, Promtail        |

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
    - **Frontend**: [http://localhost](http://localhost)
    - **Backend API**: [http://localhost:8000](http://localhost:8000)
    - **Mobile Preview**: [http://localhost:8080](http://localhost:8080)

    Port dapat diubah melalui file `.env`, misalnya `FRONTEND_PORT`, `BACKEND_PORT`, `MOBILE_PORT`, dan `GRAFANA_PORT`.

---

## Monitoring & Observability

Project ini dilengkapi stack monitoring berbasis Docker untuk memantau data bisnis, metrik container, dan log Laravel.

### Komponen Monitoring

| Komponen                  | Fungsi                                                                 |
| :------------------------ | :--------------------------------------------------------------------- |
| **Grafana**               | Dashboard utama untuk membaca data MySQL, metrik Prometheus, dan log Loki |
| **Prometheus**            | Menyimpan metrik time-series container                                 |
| **Docker Stats Exporter** | Mengambil statistik container dari Docker socket                       |
| **Loki**                  | Menyimpan dan mencari log aplikasi                                     |
| **Promtail**              | Membaca `backend/storage/logs/*.log` dan mengirimkannya ke Loki         |

### Akses Monitoring

| Service                   | URL Default                              |
| :------------------------ | :--------------------------------------- |
| **Grafana**               | [http://localhost:3000](http://localhost:3000) |
| **Prometheus**            | [http://localhost:9090](http://localhost:9090) |
| **Docker Stats Exporter** | [http://localhost:9104/metrics](http://localhost:9104/metrics) |
| **Loki Ready Check**      | [http://localhost:3100/ready](http://localhost:3100/ready) |

Login default Grafana mengikuti `.env`:

```env
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
```

> [!WARNING]
> Jika Grafana dibuka ke internet, ganti `GRAFANA_ADMIN_PASSWORD` dengan password yang kuat dan gunakan Cloudflare Access atau proteksi sejenis.

### Dashboard Grafana

- **Office Rent Overview**: metrik bisnis dari MySQL, seperti revenue, booking aktif, booking pending, user terdaftar, ruangan populer, dan booking terbaru.
- **Office Rent Observability**: metrik teknis seperti status container, CPU, memory, network I/O, log Laravel, dan jumlah error/exception.

### Alur Data Monitoring

```text
MySQL -> Grafana
Docker containers -> Docker Stats Exporter -> Prometheus -> Grafana
backend/storage/logs/*.log -> Promtail -> Loki -> Grafana
```

### Online Lewat Cloudflare

Grafana dapat di-online-kan lewat Cloudflare Tunnel tanpa membuka port publik server. Atur `.env`:

```env
GRAFANA_DOMAIN=grafana.example.com
GRAFANA_ROOT_URL=https://grafana.example.com
GRAFANA_ENFORCE_DOMAIN=true
GRAFANA_COOKIE_SECURE=true
```

Lalu di Cloudflare Zero Trust, tambahkan Public Hostname dengan service:

```text
http://grafana:3000
```

Panduan lebih lengkap tersedia di [docs/grafana.md](docs/grafana.md).

---

## 🔑 Akun Demo (Default Seeder)

| Role      | Email               | Password |
| :-------- | :------------------ | :------- |
| **Admin** | admin@sewaruang.com | password |
| **User**  | budi@gmail.com      | password |

---

## 📐 Arsitektur & Alur Kerja (Mermaid Diagram)

Platform ini dilengkapi dengan pemetaan arsitektur interaktif langsung menggunakan **Mermaid** untuk rendering visual native di GitHub/GitLab.

### 🎭 Use Case Diagram

```mermaid
graph LR
    subgraph Aktor
        U["👤 User (Penyewa)"]
        A["🔑 Admin"]
    end

    subgraph "Sewa Ruang System"
        UC1("Registrasi & Login")
        UC2("Cari & Detail Ruangan")
        UC3("Pesan Ruangan & Addons")
        UC4("Gunakan Kupon Diskon")
        UC5("Riwayat & Detail Pesanan")
        UC6("Cetak Invoice")
        UC7("Perpanjang Kontrak")
        UC8("Beri Ulasan & Rating")
        
        UC9("Kelola Data Ruangan")
        UC10("Kelola Pemesanan & Status")
        UC11("Kelola Kupon Diskon")
        UC12("Pantau Statistik Dashboard")
        UC13("Moderasi Ulasan")
    end

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8

    A --> UC1
    A --> UC9
    A --> UC10
    A --> UC11
    A --> UC12
    A --> UC13

    %% Styling
    style U fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a
    style A fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    
    classDef usecase fill:#f1f5f9,stroke:#64748b,stroke-width:1px,color:#0f172a
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11,UC12,UC13 usecase
```

<details>
<summary>🖼️ Lihat Gambar Static (Fallback)</summary>

![Use Case Diagram](docs/Use%20Case%20Diagram.png)
</details>

### 🌊 Flowchart: Alur Pemesanan Ruangan

```mermaid
graph TD
    Start([🏁 Mulai]) --> Search[Cari Ruangan]
    Search --> Detail[Lihat Detail Ruangan & Addons]
    Detail --> CheckLogin{Sudah Login?}
    
    CheckLogin -- Tidak --> Login[Login / Register]
    Login --> Detail
    
    CheckLogin -- Ya --> Select[Pilih Tanggal & Durasi]
    Select --> Addons[Pilih Fasilitas Tambahan]
    Addons --> Coupon[Masukkan Kode Kupon]
    Coupon --> Review[Cek Ringkasan Biaya]
    
    Review --> Submit[Ajukan Pemesanan]
    Submit --> AdminConfirm{Konfirmasi Admin?}
    
    AdminConfirm -- Ditolak --> Batal[❌ Status: Dibatalkan]
    AdminConfirm -- Diterima --> Confirm[✅ Status: Dikonfirmasi]
    
    Confirm --> Invoice[📄 Cetak Invoice]
    Batal --> End([🏁 Selesai])
    Invoice --> End
    
    %% Styling
    style Start fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
    style End fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
    style CheckLogin fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style AdminConfirm fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style Batal fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
    style Confirm fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#065f46
    
    classDef step fill:#dbeafe,stroke:#2563eb,stroke-width:1px,color:#1e3a8a
    class Search,Detail,Login,Select,Addons,Coupon,Review,Submit,Invoice step
```

<details>
<summary>🖼️ Lihat Gambar Static (Fallback)</summary>

![Alur Pemesanan Ruangan](docs/Flowchart%20Pemesanan%20Ruangan.png)
</details>

### 📊 Flowchart: Alur Kelola Admin

```mermaid
graph TD
    A[🔑 Login Admin] --> B{Pilih Menu Operasional}
    
    B --> C[🏢 Kelola Ruangan]
    B --> D[📅 Kelola Pemesanan]
    B --> E[🎟️ Kelola Kupon]
    B --> F[💬 Moderasi Ulasan]
    
    C --> C1[Tambah / Edit / Hapus Ruangan]
    D --> D1[Update Status & Persetujuan]
    E --> E1[Buat Kode Diskon Baru]
    F --> F1[Hapus Ulasan Negatif / Spam]
    
    C1 & D1 & E1 & F1 --> G[📈 Update Dashboard Stats]
    
    %% Styling
    style A fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style B fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a
    style G fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#065f46
    
    classDef action fill:#f1f5f9,stroke:#64748b,stroke-width:1px,color:#0f172a
    class C,D,E,F action
    
    classDef detail fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#334155
    class C1,D1,E1,F1 detail
```

<details>
<summary>🖼️ Lihat Gambar Static (Fallback)</summary>

![Alur Kelola Admin](docs/Flowchart%20Kelola%20Admin.png)
</details>

### 🗺️ Peta Navigasi Halaman (Web Sitemap)

```mermaid
graph TD
    %% Nodes
    Home["🏠 Landing Page (Home)"]
    
    %% Auth
    Login["🔐 Login / Register"]
    
    %% User Pages
    List["🏢 Daftar Ruangan"]
    Detail["ℹ️ Detail Ruangan"]
    Book["📝 Form Pemesanan"]
    Invoice["📄 Detail Pesanan & Invoice"]
    Profile["👤 Profil & Keamanan"]
    History["📅 Pesanan Saya (Riwayat)"]
    
    %% Admin Pages
    Dash["📊 Dashboard Admin Stats"]
    AdminRooms["🏢 Kelola Ruangan (CRUD)"]
    AdminBookings["📅 Kelola Pemesanan (Status)"]
    AdminCoupons["🎟️ Kelola Kupon (CRUD)"]
    AdminReviews["💬 Moderasi Ulasan (Delete)"]
    
    %% Navigation flows
    Home -->|Pilih Ruangan| List
    List -->|Lihat Detail| Detail
    Detail -->|Booking Ruangan| LoginCheck{Sudah Login?}
    
    LoginCheck -->|Ya| Book
    LoginCheck -->|Tidak| Login
    Login -->|Auto Redirect| Book
    
    Book -->|Konfirmasi Bayar| Invoice
    
    %% User Nav
    Home -->|Navigasi Menu| Profile
    Home -->|Navigasi Menu| History
    History -->|Lihat Invoice| Invoice
    
    %% Admin Nav
    Login -->|Role Admin| Dash
    Dash -->|Sidebar Menu| AdminRooms
    Dash -->|Sidebar Menu| AdminBookings
    Dash -->|Sidebar Menu| AdminCoupons
    Dash -->|Sidebar Menu| AdminReviews
    
    %% Styling
    style Home fill:#f8fafc,stroke:#475569,stroke-width:2px,color:#0f172a
    style Login fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
    style LoginCheck fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    
    classDef userPage fill:#dbeafe,stroke:#2563eb,stroke-width:1px,color:#1e3a8a
    class List,Detail,Book,Invoice,Profile,History userPage
    
    classDef adminPage fill:#d1fae5,stroke:#10b981,stroke-width:1px,color:#065f46
    class Dash,AdminRooms,AdminBookings,AdminCoupons,AdminReviews adminPage
```

<details>
<summary>🖼️ Lihat Gambar Static (Fallback)</summary>

![Peta Navigasi Halaman](docs/Flowchart%20Web%20Sewa%20Ruang.png)
</details>

Detail lebih lanjut dan kode Mermaid interaktif dapat dilihat pada dokumentasi internal:
👉 [diagram_arsitektur.md](docs/diagram_arsitektur.md)

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

_Dibuat dengan ❤️ oleh Fadlan Achmad Frizal_
