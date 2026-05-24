# 🐧 DevOps Runbook & Troubleshooting Guide - Wisma 46 Space

Dokumen ini adalah panduan operasional teknis (*Runbook*) untuk administrator sistem dan DevOps Engineer guna mengelola, mengamankan, mencadangkan, dan memulihkan infrastruktur **Wisma 46 Space** pada server **VPS KVM Ubuntu 22.04 LTS**.

---

## 🛡️ Bagian 1: Server Hardening & DevSecOps

Meskipun seluruh layanan internal diikat (*bound*) ke `127.0.0.1`, pengamanan sistem operasi adalah baris pertahanan pertama yang wajib diterapkan.

### 1.1 Autentikasi SSH Key-Only
Matikan autentikasi menggunakan password biasa untuk mencegah serangan *brute force* SSH.

1. Kirim SSH Public Key komputer lokal Anda ke VPS:
   ```bash
   ssh-copy-id -i ~/.ssh/id_rsa.pub fadlan@<IP_VPS_ANDA>
   ```
2. Masuk ke VPS dan edit berkas konfigurasi SSH daemon:
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```
3. Ubah parameter berikut menjadi:
   ```text
   PasswordAuthentication no
   PubkeyAuthentication yes
   PermitRootLogin prohibit-password
   ```
4. Uji konfigurasi SSH sebelum me-restart daemon untuk menghindari terkunci keluar:
   ```bash
   sudo sshd -t
   ```
5. Jika tidak ada error, restart layanan SSH:
   ```bash
   sudo systemctl restart ssh
   ```

### 1.2 Firewall (UFW) & Port Isolation
Karena aplikasi Anda menggunakan **Cloudflare Tunnel (`office_rent_tunnel`)**, kontainer melakukan koneksi *outbound* (keluar) ke server Cloudflare. Artinya, **Anda tidak perlu membuka port HTTP (80) atau HTTPS (443) ke publik**. 

Konfigurasi UFW yang sangat ketat dan aman:

```bash
# 1. Izinkan port SSH terlebih dahulu (Wajib agar tidak terkunci!)
sudo ufw allow 22/tcp

# 2. Aktifkan Firewall
sudo ufw enable

# 3. Cek status verbose
sudo ufw status verbose
```

*Semua port internal seperti database MySQL (3306), Grafana (3000), dan Prometheus (9090) akan diblokir oleh UFW jika diakses dari luar, tetapi tetap bisa saling berkomunikasi dengan aman di dalam Docker Network internal.*

---

## 💾 Bagian 2: Strategi Backup Database Otomatis (Cron & S3/R2)

Kehilangan data transaksi adalah bencana besar. Berikut adalah langkah untuk mengotomatiskan pencadangan database MySQL harian dan menyimpannya di Cloud Storage terpisah (*Offsite Backup*).

### 2.1 Shell Script Backup (`/var/www/w46space/scripts/db_backup.sh`)
Buat script pencadangan database menggunakan `mysqldump` terkompresi:

```bash
#!/bin/bash

# Konfigurasi
BACKUP_DIR="/var/www/w46space/backups"
DB_CONTAINER_NAME="office_rent_db"
DB_NAME="office_rent"
DATE=$(date +%Y-%m-%d_%H%M%S)
FILENAME="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Membuat folder backup jika belum ada
mkdir -p $BACKUP_DIR

# Menjalankan dump database dari dalam kontainer Docker
docker exec $DB_CONTAINER_NAME mysqldump -u root -p'password' $DB_NAME | gzip > $FILENAME

# Menghapus berkas cadangan lokal yang lebih tua dari 7 hari agar disk tidak penuh
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete

echo "Backup berhasil disimpan di $FILENAME"
```

### 2.2 Otomatisasi dengan Cron Job
Jadwalkan script di atas untuk berjalan otomatis setiap tengah malam (jam `00:00` WIB):

1. Buka editor crontab pengguna root:
   ```bash
   sudo crontab -e
   ```
2. Tambahkan baris jadwal berikut di bagian paling bawah:
   ```text
   0 0 * * * /bin/bash /var/www/w46space/scripts/db_backup.sh >> /var/log/db_backup.log 2>&1
   ```

---

## 📊 Bagian 3: Observability & Log Aggregation Playbook

### 3.1 Struktur Log
Log sistem didistribusikan secara otomatis melalui Promtail ke Loki:
* **Laravel Application Logs**: `backend/storage/logs/laravel.log` -> Dibaca oleh **Promtail** -> Dikirim ke **Loki** -> Ditampilkan di panel **Grafana Explore**.
* **Docker Container Logs**: Semua keluaran stdout/stderr kontainer ditangkap langsung oleh Docker Daemon.

### 3.2 Query Log di Grafana (LogQL)
Buka Grafana Dashboard Anda (default: `http://localhost:3000` atau domain Cloudflare Anda), masuk ke menu **Explore**, pilih datasource **Loki**, dan gunakan query berikut:

* **Mencari Log Error di Laravel**:
  ```text
  {job="laravel-logs"} |= "ERROR"
  ```
* **Mencari Log Terkait Transaksi Booking**:
  ```text
  {job="laravel-logs"} |= "Booking"
  ```

---

## 🚨 Bagian 4: Panduan Pemulihan Bencana (Disaster Recovery)

### 4.1 Apa yang Harus Dilakukan Jika Database `office_rent_db` Crash/Mati?
1. Periksa status kontainer database:
   ```bash
   docker ps -a --filter name=office_rent_db
   ```
2. Baca log kontainer untuk mencari penyebab mati (misal: memori habis atau korup data):
   ```bash
   docker logs office_rent_db
   ```
3. Restart kontainer database secara aman:
   ```bash
   docker-compose restart db
   ```
4. Jika data rusak parah, lakukan **Restore** dari file cadangan harian terakhir:
   ```bash
   # Ekstrak file SQL cadangan
   gunzip -c /var/www/w46space/backups/db_backup_TERBARU.sql.gz > /tmp/restore.sql
   
   # Import kembali ke dalam kontainer database MySQL
   docker exec -i office_rent_db mysql -u root -p'password' office_rent < /tmp/restore.sql
   ```

### 4.2 Masalah Kehabisan Ruang Penyimpanan VPS (Disk Space Full)
Layanan Loki, Promtail, dan MySQL yang terus menyala lama-kelamaan akan menumpuk log dan cache volume Docker.

1. Cek kapasitas penyimpanan disk VPS Anda:
   ```bash
   df -h
   ```
2. Bersihkan penumpukan cache build Docker dan kontainer yatim (*orphaned*) yang sudah tidak terpakai:
   ```bash
   docker system prune -a --volumes -f
   ```
3. Batasi ukuran maksimal berkas log Docker di file `docker-compose.yml` agar tidak meluap tak terbatas:
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```
