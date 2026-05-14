# 📊 Diagram Arsitektur Sewa Ruang

Dokumen ini menjelaskan interaksi pengguna dan alur kerja utama dalam platform Sewa Ruang.

---

## 1. Use Case Diagram
Diagram ini menunjukkan hubungan antara pengguna (**User** & **Admin**) dengan fitur-fitur yang tersedia di sistem.

```mermaid
graph LR
    subgraph "Sewa Ruang Platform"
        UC1(Melihat Daftar Ruangan)
        UC2(Melihat Ruangan Populer)
        UC3(Registrasi & Login)
        UC4(Melakukan Pemesanan)
        UC5(Melihat Riwayat Pesanan)
        UC6(Mengelola Profil)
        UC7(Dashboard Statistik)
        UC8(Mengelola Data Ruangan)
        UC9(Mengelola Data Pemesanan)
    end

    User((User Penyewa)) --- UC1
    User --- UC2
    User --- UC3
    User --- UC4
    User --- UC5
    User --- UC6

    Admin((Admin)) --- UC3
    Admin --- UC7
    Admin --- UC8
    Admin --- UC9

    style User fill:#2563eb,color:#fff
    style Admin fill:#1e293b,color:#fff
    style UC1 fill:#f8fafc
```

---

## 2. Flowchart: Alur Pemesanan Ruangan
Diagram ini menjelaskan langkah-langkah yang dilalui pengguna dari mencari ruangan hingga berhasil melakukan pemesanan.

```mermaid
flowchart TD
    Start([Mulai]) --> Browse[Telusuri Daftar Ruangan]
    Browse --> Detail[Lihat Detail Ruangan]
    Detail --> CheckLogin{Sudah Login?}
    
    CheckLogin -- Tidak --> Login[Halaman Login / Register]
    Login --> CheckLogin
    
    CheckLogin -- Ya --> FillForm[Isi Form Pemesanan]
    FillForm --> Submit[Klik Pesan Sekarang]
    
    Submit --> Validate{Validasi Input?}
    Validate -- Error --> FillForm
    Validate -- Sukses --> Confirm[Konfirmasi Berhasil]
    
    Confirm --> ViewOrders[Lihat Pesanan Saya]
    ViewOrders --> End([Selesai])

    style Start fill:#2563eb,color:#fff
    style End fill:#2563eb,color:#fff
    style CheckLogin fill:#fff4dd,stroke:#d4a017,stroke-width:2px
    style Validate fill:#fff4dd,stroke:#d4a017,stroke-width:2px
```

---

## 3. Penjelasan Singkat

### Aktor Utama:
1.  **User (Penyewa)**: Fokus pada pencarian ruangan kerja yang sesuai kebutuhan dan melakukan transaksi pemesanan secara mandiri.
2.  **Admin**: Bertugas menjaga ketersediaan data ruangan, memantau statistik di dashboard, dan mengelola status pemesanan yang masuk.

### Alur Utama (Booking):
Sistem memastikan pengguna sudah terautentikasi sebelum melakukan pemesanan. Proses validasi dilakukan di sisi backend untuk memastikan data (seperti tanggal dan durasi) sudah benar sebelum disimpan ke database.
