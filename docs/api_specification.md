# 🔌 RESTful API Specification - Wisma 46 Space

Dokumen ini mendefinisikan kontrak komunikasi data (*API Contract*) antara **Frontend (React)** dan **Backend (Laravel)** di dalam platform **Wisma 46 Space**.

---

## 🔑 Bagian 1: Autentikasi Sesi

Semua API yang membutuhkan hak akses wajib menyertakan token autentikasi di dalam header HTTP request:
```text
Authorization: Bearer <TOKEN_AUTENTIKASI>
Content-Type: application/json
Accept: application/json
```

### 1.1 Login Akun (`POST /api/login`)
* **Request Body**:
  ```json
  {
    "email": "user@gmail.com",
    "password": "password"
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Login berhasil",
    "token": "1|xJ9K8sd83Jalks0sd8J...",
    "user": {
      "id": 2,
      "name": "Budi Santoso",
      "email": "user@gmail.com",
      "role": "User"
    }
  }
  ```

---

## 🏢 Bagian 2: Layanan Ruangan (Offices)

### 2.1 Mengambil Semua Ruangan (`GET /api/offices`)
* **Query Params (Opsional)**: `kategori=Meeting Room`
* **Response Sukses (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "nama": "Eternity Executive Room",
      "kategori": "Meeting Room",
      "harga": 1500000,
      "kapasitas": 12,
      "status": "Tersedia",
      "is_booked": false,
      "booked_until": null,
      "gambar": "http://localhost:8000/storage/rooms/eternity.jpg",
      "fasilitas": ["High-Speed WiFi", "Projector 4K", "Whiteboard", "AC"]
    }
  ]
  ```

### 2.2 Mengambil Detail Ruangan (`GET /api/offices/{id}`)
* **Response Sukses (200 OK)**:
  ```json
  {
    "id": 1,
    "nama": "Eternity Executive Room",
    "kategori": "Meeting Room",
    "harga": 1500000,
    "kapasitas": 12,
    "status": "Tersedia",
    "is_booked": true,
    "booked_until": "2026-06-30",
    "gambar": "http://localhost:8000/storage/rooms/eternity.jpg",
    "fasilitas": ["High-Speed WiFi", "Projector 4K", "Whiteboard", "AC"],
    "bookings": [
      {
        "tanggal_mulai": "2026-06-01",
        "tanggal_akhir": "2026-06-30",
        "status": "Dikonfirmasi"
      }
    ]
  }
  ```

---

## 📅 Bagian 3: Sistem Pemesanan (Bookings)

### 3.1 Mengajukan Sewa Ruangan Baru (`POST /api/bookings`)
* **Request Body**:
  ```json
  {
    "id_ruangan": 1,
    "nama_pemesan": "Budi Santoso",
    "perusahaan": "PT. Sukses Selalu",
    "tanggal_mulai": "2026-07-01",
    "tanggal_akhir": "2026-08-01",
    "waktu_mulai": "08:00",
    "waktu_selesai": "17:00",
    "durasi": 1,
    "total_harga": 39000000,
    "coupon_code": "KUPONSAYA",
    "addon_ids": [1, 2]
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "message": "Pemesanan berhasil diajukan",
    "booking": {
      "id": 1024,
      "id_ruangan": 1,
      "status": "Pending",
      "total_harga": 39000000,
      "tanggal_mulai": "2026-07-01",
      "tanggal_akhir": "2026-08-01"
    }
  }
  ```

### 3.2 Menambahkan Fasilitas Tambahan ke Booking Aktif (`POST /api/bookings/{id}/addons`)
* **Request Body**:
  ```json
  {
    "addon_ids": [3]
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "message": "Fasilitas tambahan berhasil diajukan, menunggu konfirmasi admin."
  }
  ```

---

## 🎟️ Bagian 4: Fasilitas Tambahan & Kupon Promo

### 4.1 Mengambil Semua Addons (`GET /api/addons`)
* **Response Sukses (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "nama": "Premium Coffee Service",
      "harga": 250000,
      "icon": "Coffee"
    },
    {
      "id": 2,
      "nama": "Dedicated High-Speed WiFi (Static IP)",
      "harga": 500000,
      "icon": "Wifi"
    }
  ]
  ```

### 4.2 Validasi Kode Kupon Promo (`GET /api/coupons/check/{code}`)
* **Response Sukses (200 OK)**:
  ```json
  {
    "code": "KUPONSAYA",
    "type": "percentage",
    "value": 10,
    "message": "Kupon valid. Diskon 10% berhasil diterapkan."
  }
  ```
* **Response Gagal (422 Unprocessable Entity)**:
  ```json
  {
    "message": "Kode kupon telah kadaluarsa atau kuota habis."
  }
  ```
