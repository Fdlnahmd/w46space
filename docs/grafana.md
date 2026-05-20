# Belajar Grafana Lewat Office Rent

Setup ini menambahkan Grafana sebagai dashboard observability sederhana untuk database MySQL project Office Rent.

## Jalankan

```bash
docker-compose up -d --build
```

Buka:

- Grafana: `http://localhost:${GRAFANA_PORT}`
- Prometheus: `http://${PROMETHEUS_BIND_HOST}:${PROMETHEUS_PORT}`
- Docker stats exporter: `http://${DOCKER_STATS_EXPORTER_BIND_HOST}:${DOCKER_STATS_EXPORTER_PORT}/metrics`
- Loki: `http://${LOKI_BIND_HOST}:${LOKI_PORT}/ready`
- Login default: `admin` / `admin`
- Dashboard: `Office Rent / Office Rent Overview`
- Dashboard observability: `Office Rent / Office Rent Observability`

Grafana otomatis membaca datasource dari `grafana/provisioning/datasources/` dan dashboard dari `grafana/dashboards/`.

## Yang Dipelajari

1. Datasource
   Grafana tersambung ke MySQL service Docker lewat host `mysql:3306`.

2. Query SQL
   Panel dashboard memakai query langsung ke tabel `bookings`, `offices`, dan `users`.

3. Panel
   Dashboard awal berisi stat, time series, pie chart, dan table.

4. Time range
   Panel time series memakai macro Grafana seperti `$__timeFilter(created_at)` dan `$__timeGroupAlias(created_at, '1d')`.

5. Prometheus
   Prometheus mengambil metrik container dari Docker stats exporter setiap 15 detik.

6. Loki
   Promtail membaca file `backend/storage/logs/*.log` dan mengirim log Laravel ke Loki.

## Datasource

- `Office Rent MySQL`: data bisnis dari MySQL.
- `Office Rent Prometheus`: metrik container dari Docker stats exporter.
- `Office Rent Loki`: log Laravel dari Promtail.

## Query Prometheus Awal

CPU per container:

```promql
sum by (service) (rate(office_rent_container_cpu_usage_seconds_total{state="running"}[5m]))
```

Memory per container:

```promql
sum by (service) (office_rent_container_memory_usage_bytes{state="running"})
```

Network receive per container:

```promql
sum by (service) (rate(office_rent_container_network_receive_bytes_total{state="running"}[5m]))
```

## Query Loki Awal

Semua log Laravel:

```logql
{app="office-rent", job="laravel"}
```

Cari error atau exception:

```logql
{app="office-rent", job="laravel"} |~ "(?i)(error|exception|critical)"
```

Hitung error di time range dashboard:

```logql
sum(count_over_time({app="office-rent", job="laravel"} |~ "(?i)(error|exception|critical)" [$__range]))
```

## Latihan Lanjutan

- Tambah panel revenue per kategori ruangan.
- Tambah panel booking yang dibatalkan per minggu.
- Tambah variable dashboard untuk filter status booking.
- Tambah alert Grafana saat backend/container MySQL down.
- Tambah alert saat log Laravel mengandung `ERROR` lebih dari 5 kali dalam 10 menit.

## Online Lewat Cloudflare Tunnel

Project ini sudah punya service `cloudflared`, jadi Grafana bisa diakses lewat subdomain tanpa membuka port publik server.

Contoh target:

```text
https://grafana.example.com
```

Atur `.env`:

```env
GRAFANA_DOMAIN=grafana.example.com
GRAFANA_ROOT_URL=https://grafana.example.com
GRAFANA_ENFORCE_DOMAIN=true
GRAFANA_COOKIE_SECURE=true
```

Lalu di Cloudflare Zero Trust Dashboard:

1. Buka `Networks` -> `Tunnels`.
2. Pilih tunnel yang tokennya dipakai di `TUNNEL_TOKEN`.
3. Tambah `Public Hostname`.
4. Isi hostname, misalnya `grafana.example.com`.
5. Isi service:

```text
http://grafana:3000
```

`grafana` adalah nama service Docker Compose, jadi bisa diakses oleh container `cloudflared` lewat network yang sama.

Setelah itu jalankan ulang:

```bash
docker-compose up -d
```

Untuk keamanan, jangan pakai password default `admin/admin` saat Grafana dibuka ke internet. Ganti `GRAFANA_ADMIN_PASSWORD` di `.env`, lalu restart container Grafana.
