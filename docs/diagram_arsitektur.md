# 📐 Arsitektur & Alur Sistem - Sewa Ruang

Dokumen ini menjelaskan alur kerja dan arsitektur dari platform **Sewa Ruang**.

---

## 🎭 Use Case Diagram

Diagram ini menjelaskan interaksi antara aktor (User & Admin) dengan sistem.

![Use Case Diagram](Use%20Case%20Diagram.png)

<details>
<summary>💻 Lihat Kode Mermaid (Use Case Diagram)</summary>

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

</details>

---

## 🌊 Flowchart: Alur Pemesanan Ruangan

Alur dari pencarian ruangan hingga pembayaran dan konfirmasi.

![Alur Pemesanan Ruangan](Flowchart%20Pemesanan%20Ruangan.png)

<details>
<summary>💻 Lihat Kode Mermaid (Flowchart Pemesanan Ruangan)</summary>

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

</details>

---

## 📊 Flowchart: Alur Kelola Admin

Alur admin dalam mengelola operasional platform.

![Alur Kelola Admin](Flowchart%20Kelola%20Admin.png)

<details>
<summary>💻 Lihat Kode Mermaid (Flowchart Kelola Admin)</summary>

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

</details>

---

## 🗺️ Peta Navigasi Halaman (Web Sitemap / Page Flowchart)

Diagram ini menggambarkan peta navigasi situs web, dari Landing Page menuju berbagai sub-halaman pengguna dan panel dashboard admin.

![Peta Navigasi Halaman](Flowchart%20Web%20Sewa%20Ruang.png)

<details>
<summary>💻 Lihat Kode Mermaid (Peta Navigasi Halaman)</summary>

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

</details>

---

## 3. Penjelasan Singkat

### Aktor Utama:
1.  **User (Penyewa)**: Fokus pada pencarian ruangan kerja yang sesuai kebutuhan dan melakukan transaksi pemesanan secara mandiri.
2.  **Admin**: Bertugas menjaga ketersediaan data ruangan, memantau statistik di dashboard, dan mengelola status pemesanan yang masuk.

### Alur Utama (Booking):
Sistem memastikan pengguna sudah terautentikasi sebelum melakukan pemesanan. Proses validasi dilakukan di sisi backend untuk memastikan data (seperti tanggal dan durasi) sudah benar sebelum disimpan ke database.
