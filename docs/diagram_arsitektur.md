# 📐 Arsitektur & Alur Sistem - Wisma 46 Space

Dokumen ini menjelaskan alur kerja dan arsitektur dari platform **Wisma 46 Space**.

---

## 🎭 Use Case Diagram

Diagram ini menjelaskan interaksi antara aktor (User & Admin) dengan sistem.

<details>

```mermaid
graph LR
    subgraph Aktor
        U["👤 User (Penyewa)"]
        H["🎧 Helpdesk"]
        A["🔑 Admin"]
    end

    subgraph "Wisma 46 Space System"
        UC1("Registrasi & Login")
        UC2("Cari & Detail Ruangan")
        UC3("Pesan Ruangan & Addons")
        UC4("Gunakan Kupon Diskon")
        UC5("Riwayat & Detail Pesanan")
        UC6("Cetak Invoice")
        UC7("Perpanjang Kontrak")
        UC8("Beri Ulasan & Rating")
        UC14("Tanya AI Chatbot (Ketersediaan/Vacancy)")
        UC15("Booking Ruangan Penuh (Future Booking)")
        
        UC9("Kelola Data Ruangan")
        UC10("Kelola Pemesanan & Status")
        UC11("Kelola Kupon Diskon")
        UC12("Pantau Statistik Dashboard")
        UC13("Moderasi Ulasan")
        UC16("Chatting Helpdesk/Admin Terpadu")
        UC17("Terima Alert Container Down via Email")
        UC18("Ubah Bahasa / Switch Language (ID/EN)")
    end

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8
    U --> UC14
    U --> UC15
    U --> UC18

    H --> UC1
    H --> UC16
    H --> UC18

    A --> UC1
    A --> UC9
    A --> UC10
    A --> UC11
    A --> UC12
    A --> UC13
    A --> UC16
    A --> UC17
    A --> UC18

    %% Styling
    style U fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a
    style H fill:#f3e8ff,stroke:#a855f7,stroke-width:2px,color:#581c87
    style A fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    
    classDef usecase fill:#f1f5f9,stroke:#64748b,stroke-width:1px,color:#0f172a
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11,UC12,UC13,UC14,UC15,UC16,UC17,UC18 usecase
```

</details>

---

## 🌊 Flowchart: Alur Pemesanan Ruangan

Alur dari pencarian ruangan hingga pembayaran dan konfirmasi.

<details>

```mermaid
graph TD
    Start([🏁 Mulai]) --> Search[Cari Ruangan]
    Search --> Detail[Lihat Detail Ruangan & Addons]
    Detail --> CheckBooked{Ruangan Penuh?}
    
    CheckBooked -- Ya --> FutureAlert[Tampilkan Notifikasi Ketersediaan & Auto-Set H+1 Kontrak Selesai]
    CheckBooked -- Tidak --> CheckLogin
    FutureAlert --> CheckLogin
    
    CheckLogin{Sudah Login?} -- Tidak --> Login[Login / Register]
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
    style CheckBooked fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style AdminConfirm fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style Batal fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
    style Confirm fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#065f46
    
    classDef step fill:#dbeafe,stroke:#2563eb,stroke-width:1px,color:#1e3a8a
    class Search,Detail,Login,Select,Addons,Coupon,Review,Submit,Invoice,FutureAlert step
```

</details>

---

## 📊 Flowchart: Alur Kelola Admin

Alur admin dalam mengelola operasional platform.


<details>

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

## 🎧 Flowchart: Alur Kelola Helpdesk

Alur kerja petugas support / Helpdesk dalam membalas chat dan memantau pemesanan ruangan.

<details>

```mermaid
graph TD
    Start([🏁 Mulai]) --> Login[🔑 Login Staff]
    Login --> CheckRole{Apakah Role Helpdesk?}
    
    CheckRole -- Tidak (Admin) --> AdminFlow[Akses Full Dashboard & CRUD]
    CheckRole -- Ya (Helpdesk) --> RedirectChat[💬 Redirect Langsung ke Dashboard Live Chat]
    
    RedirectChat --> HelpdeskOptions{Pilih Menu Operasional}
    
    HelpdeskOptions --> HandleChat[💬 Balas & Kelola Live Chat]
    HelpdeskOptions --> HandleBookings[📅 Kelola Pemesanan]
    HelpdeskOptions --> CheckRestricted{Akses Fitur Lain?}
    
    HandleChat --> UpdateChat[Update Status Percakapan / Selesai]
    HandleBookings --> UpdateBookingStatus[Konfirmasi / Batalkan / Detail Pesanan]
    
    CheckRestricted --> CRUD_Rooms[🏢 CRUD Ruangan]
    CheckRestricted --> CRUD_Coupons[🎟️ CRUD Kupon]
    CheckRestricted --> Mod_Reviews[💬 Moderasi Ulasan]
    CheckRestricted --> RoomBooking[📝 Form Pemesanan Ruangan]
    
    CRUD_Rooms & CRUD_Coupons & Mod_Reviews & RoomBooking --> Blocked[🚫 Akses Ditolak / Halaman Terkunci]
    
    UpdateChat & UpdateBookingStatus & Blocked --> End([🏁 Selesai])
    
    %% Styling
    style Start fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
    style End fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a
    style CheckRole fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style HelpdeskOptions fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a
    style Blocked fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
    style AdminFlow fill:#f1f5f9,stroke:#64748b,stroke-width:1px,color:#0f172a
    
    classDef op fill:#f1f5f9,stroke:#64748b,stroke-width:1px,color:#0f172a
    class HandleChat,HandleBookings,CheckRestricted,UpdateChat,UpdateBookingStatus op
    
    classDef locked fill:#f8fafc,stroke:#cbd5e1,stroke-width:1px,color:#94a3b8
    class CRUD_Rooms,CRUD_Coupons,Mod_Reviews,RoomBooking locked
```

</details>

---

## 🗺️ Peta Navigasi Halaman (Web Sitemap / Page Flowchart)

Diagram ini menggambarkan peta navigasi situs web, dari Landing Page menuju berbagai sub-halaman pengguna dan panel dashboard admin.


<details>

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
    Chat["💬 Floating Chat (Tanya AI/Human)"]
    
    %% Admin & Helpdesk Pages
    Dash["📊 Dashboard Admin Stats"]
    AdminRooms["🏢 Kelola Ruangan (CRUD)"]
    AdminBookings["📅 Kelola Pemesanan (Status)"]
    AdminCoupons["🎟️ Kelola Kupon (CRUD)"]
    AdminReviews["💬 Moderasi Ulasan (Delete)"]
    AdminChat["💬 Dashboard Live Chat (Helpdesk/Admin)"]
    
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
    Home -->|Buka Chat| Chat
    History -->|Lihat Invoice| Invoice
    
    %% Admin & Helpdesk Nav
    Login -->|Role Admin| Dash
    Login -->|Role Helpdesk| AdminChat
    
    Dash -->|Sidebar Menu| AdminRooms
    Dash -->|Sidebar Menu| AdminBookings
    Dash -->|Sidebar Menu| AdminCoupons
    Dash -->|Sidebar Menu| AdminReviews
    Dash -->|Sidebar Menu| AdminChat
    
    AdminChat -->|Sidebar Menu| AdminBookings
    AdminBookings -->|Sidebar Menu| AdminChat
    
    %% Styling
    style Home fill:#f8fafc,stroke:#475569,stroke-width:2px,color:#0f172a
    style Login fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
    style LoginCheck fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    
    classDef userPage fill:#dbeafe,stroke:#2563eb,stroke-width:1px,color:#1e3a8a
    class List,Detail,Book,Invoice,Profile,History,Chat userPage
    
    classDef adminPage fill:#d1fae5,stroke:#10b981,stroke-width:1px,color:#065f46
    class Dash,AdminRooms,AdminBookings,AdminCoupons,AdminReviews,AdminChat adminPage
```

</details>

---

## 3. Penjelasan Singkat

### Aktor Utama:
1.  **User (Penyewa)**: Fokus pada pencarian ruangan kerja yang sesuai kebutuhan, melakukan transaksi pemesanan secara mandiri (termasuk pemesanan di masa depan untuk ruangan yang sedang penuh), serta berkonsultasi via Live Chat/AI Chatbot.
2.  **Helpdesk**: Bertugas khusus sebagai customer support untuk membalas pesan obrolan (live chat) dari penyewa secara real-time.
3.  **Admin**: Bertugas penuh menjaga ketersediaan data ruangan (CRUD), memantau statistik dashboard, mengelola pemesanan, moderasi ulasan, membalas chat, serta memantau alerting container jika terjadi downtime.

### Alur Utama (Booking):
Sistem memastikan pengguna sudah terautentikasi sebelum melakukan pemesanan. Jika ruangan sedang disewa, sistem akan menampilkan notifikasi informatif berisi tanggal akhir sewa saat ini dan menyarankan tanggal mulai baru pada H+1 sewa selesai. Proses validasi bentrokan tanggal dilakukan di backend secara real-time untuk menjamin integritas transaksi sewa.
