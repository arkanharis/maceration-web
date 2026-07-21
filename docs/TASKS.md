# TASKS.md — Progress Tracker Maceration IoT Dashboard

> **Cara pakai file ini:** Berikan file ini bersama `rancangan-website-iot-maceration.md` ke AI/dev. Kerjakan **satu task saja per sesi**, sesuai urutan (task punya dependency ke task sebelumnya). Setelah satu task selesai & ditest, centang `[x]` dan update kolom **Status**, baru lanjut ke task berikutnya. Jangan lompat urutan kecuali dependency-nya sudah terpenuhi.

**Legend status:** `TODO` → belum dikerjakan | `IN PROGRESS` → sedang dikerjakan | `DONE` → selesai & sudah ditest | `BLOCKED` → nunggu sesuatu

---

## FASE 0 — Setup Fondasi

### Task 0.1 — Setup struktur project & environment
- **Status:** DONE
- **Output:** repo dengan folder `backend/`, `frontend/`, `firmware/`, `docs/`; `package.json` masing-masing; `.env.example`; `.gitignore`
- **Detail:**
  - Init Node.js project di `backend/` (Express, dotenv, cors)
  - Init React+Vite project di `frontend/` (Tailwind terpasang)
  - Buat `.env.example` berisi: `DATABASE_URL`, `JWT_SECRET`, `MQTT_BROKER_URL`, `MQTT_ADMIN_USER`, `MQTT_ADMIN_PASS`, `PORT`
- **Dependency:** tidak ada

### Task 0.2 — Setup database & migrasi skema
- **Status:** DONE
- **Output:** koneksi PostgreSQL jalan, semua tabel dari rancangan (`users`, `devices`, `device_access`, `device_logs`, `device_events`) terbuat lewat migration (pakai `node-pg-migrate` atau `Prisma`/`Knex`, pilih salah satu)
- **Detail:** termasuk enum types, foreign key, index pada `device_code`, `email`
- **Dependency:** Task 0.1

### Task 0.3 — Setup MQTT broker (Mosquitto) lokal untuk development
- **Status:** DONE
- **Output:** Mosquitto jalan di lokal/docker, bisa publish/subscribe manual pakai `mosquitto_pub`/`mosquitto_sub` untuk uji koneksi awal (auth belum perlu final di tahap ini, bisa allow_anonymous dulu untuk dev)
- **Dependency:** tidak ada (paralel dengan 0.1)

---

## FASE 1 — Backend: Auth & User Management

### Task 1.1 — Model & repository layer untuk `users`
- **Status:** DONE
- **Output:** fungsi CRUD dasar ke tabel `users` (create, findByEmail, findById, updateRole)
- **Dependency:** Task 0.2

### Task 1.2 — Endpoint Register & Login
- **Status:** DONE
- **Output:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login` — hash password bcrypt, return JWT saat login
- **Acceptance criteria:** bisa register user baru, login dapat token, password salah ditolak, email duplikat ditolak
- **Dependency:** Task 1.1

### Task 1.3 — Middleware Auth (JWT) & Middleware Role Check
- **Status:** DONE
- **Output:** middleware `requireAuth` (verifikasi JWT, isi `req.user`) dan `requireGlobalRole('superadmin')` untuk endpoint admin
- **Dependency:** Task 1.2

### Task 1.4 — Endpoint `GET /auth/me` & Logout
- **Status:** DONE
- **Output:** endpoint ambil data user login; logout (invalidate token di client, atau blacklist kalau mau lebih aman)
- **Dependency:** Task 1.3

---

## FASE 2 — Backend: Device Management & Klaim

### Task 2.1 — Model & repository untuk `devices` dan `device_access`
- **Status:** DONE
- **Output:** fungsi CRUD dasar + fungsi helper `getUserRoleForDevice(userId, deviceId)`
- **Dependency:** Task 0.2

### Task 2.2 — Endpoint Admin: Generate Device Baru
- **Status:** DONE
- **Output:** `POST /api/v1/admin/devices` — generate `device_code` unik (mis. auto-increment `MC-000X`) + `device_secret` random, simpan hash secret ke DB, return `device_code` + `device_secret` **plaintext hanya sekali** di response
- **Dependency:** Task 1.3, Task 2.1

### Task 2.3 — Endpoint Klaim Alat
- **Status:** DONE
- **Output:** `POST /api/v1/devices/claim` — body `{device_code}`, cek status `unclaimed`, set `owner_id`, insert ke `device_access` sebagai role `owner`, catat ke `device_events`
- **Acceptance criteria:** device sudah diklaim tidak bisa diklaim ulang, device_code tidak ada → error jelas
- **Dependency:** Task 2.2

### Task 2.4 — Endpoint List & Detail Device (dengan permission check)
- **Status:** DONE
- **Output:** `GET /api/v1/devices` (list device milik user login berdasarkan `device_access`), `GET /api/v1/devices/:id` (detail, cek user punya akses)
- **Dependency:** Task 2.3

### Task 2.5 — Endpoint Kelola Akses (Sharing)
- **Status:** DONE
- **Output:** `GET/POST/PATCH/DELETE /api/v1/devices/:id/access` — hanya owner yang boleh akses endpoint ini, share by email (kalau email belum terdaftar, kasih pesan jelas)
- **Dependency:** Task 2.4

### Task 2.6 — Endpoint Admin: List semua device & user
- **Status:** DONE
- **Output:** `GET /api/v1/admin/devices`, `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id`
- **Files dibuat/diubah:**
  - `src/repositories/deviceRepository.js` — `listAllDevices()` ditambah JOIN ke `users` untuk nama & email owner
  - `src/repositories/userRepository.js` — `listAllUsers()` baru, include `owned_device_count`
  - `src/services/adminService.js` — baru, berisi `adminListAllDevices`, `adminListAllUsers`, `adminUpdateUserRole` (dengan guard self-demotion & validasi role)
  - `src/controllers/adminController.js` — baru, 3 handler: `adminGetAllDevices`, `adminGetAllUsers`, `adminPatchUserRole`
  - `src/routes/adminRoutes.js` — tambah 3 route baru (`GET /devices`, `GET /users`, `PATCH /users/:id`)
- **Dependency:** Task 1.3, Task 2.4

---

## FASE 3 — Backend: MQTT Bridge & Real-time

### Task 3.1 — MQTT Client Service di Backend
- **Status:** TODO
- **Output:** service yang connect ke Mosquitto sebagai admin/backend client, subscribe wildcard `maceration/+/telemetry` dan `maceration/+/status`
- **Dependency:** Task 0.3

### Task 3.2 — Handler Telemetry → Simpan DB + Broadcast
- **Status:** TODO
- **Output:** saat terima pesan telemetry, parse payload, insert ke `device_logs`, update `devices.last_seen_at`, broadcast via Socket.IO ke room device tsb
- **Dependency:** Task 3.1, Task 2.1

### Task 3.3 — Handler Status Online/Offline
- **Status:** TODO
- **Output:** update `devices.connection_status`, insert ke `device_events`, broadcast `device_status_changed`
- **Dependency:** Task 3.2

### Task 3.4 — Setup Socket.IO Server & Room per Device
- **Status:** TODO
- **Output:** event `subscribe_device`/`unsubscribe_device` dengan permission check (pakai `getUserRoleForDevice`), join/leave room
- **Dependency:** Task 2.4, Task 3.1

### Task 3.5 — Endpoint/Event Kirim Command (Kontrol Relay)
- **Status:** TODO
- **Output:** `POST /api/v1/devices/:id/command` DAN event Socket.IO `send_command` — cek role owner/operator, publish ke topik `command`, tunggu/handle `command/ack`
- **Dependency:** Task 3.4, Task 2.5

### Task 3.6 — Endpoint History & Events
- **Status:** TODO
- **Output:** `GET /api/v1/devices/:id/history?from&to`, `GET /api/v1/devices/:id/events`
- **Dependency:** Task 3.2

### Task 3.7 — MQTT Auth & ACL (Device-level)
- **Status:** TODO
- **Output:** setup auth plugin Mosquitto (atau webhook auth) supaya device hanya bisa connect dengan `device_code`+`device_secret` valid, dan ACL: device hanya boleh publish/subscribe ke topik miliknya sendiri
- **Dependency:** Task 3.1, Task 2.2
- **Catatan:** ini bagian security penting, jangan skip sebelum production

---

## FASE 4 — Frontend

### Task 4.1 — Setup Routing & Layout Dasar
- **Status:** TODO
- **Output:** React Router setup, layout dengan navbar + sidebar (kondisional tampil menu admin kalau superadmin), halaman kosong untuk tiap route
- **Dependency:** Task 0.1

### Task 4.2 — Halaman Login & Register
- **Status:** TODO
- **Output:** form login/register, simpan JWT (mis. di memory/context, bukan localStorage kalau mau lebih aman — atau localStorage untuk kesederhanaan skala kecil), redirect ke dashboard setelah sukses
- **Dependency:** Task 1.2, Task 4.1

### Task 4.3 — Auth Context & Protected Routes
- **Status:** TODO
- **Output:** context React yang simpan user login, redirect ke `/login` kalau belum auth, attach JWT ke semua request axios/fetch
- **Dependency:** Task 4.2

### Task 4.4 — Dashboard Utama (List Device)
- **Status:** TODO
- **Output:** halaman grid kartu device (nama, status online/offline, preview suhu/RPM, badge role), fetch dari `GET /devices`
- **Dependency:** Task 2.4, Task 4.3

### Task 4.5 — Modal Klaim Alat
- **Status:** TODO
- **Output:** modal input Device ID, panggil `POST /devices/claim`, refresh list device setelah sukses
- **Dependency:** Task 2.3, Task 4.4

### Task 4.6 — Halaman Detail Alat: Live Data Panel
- **Status:** TODO
- **Output:** koneksi Socket.IO, subscribe ke device saat halaman dibuka, tampilkan angka suhu/RPM real-time + mini grafik (Recharts) dari data yang masuk
- **Dependency:** Task 3.4, Task 4.4

### Task 4.7 — Halaman Detail Alat: Kontrol Relay
- **Status:** TODO
- **Output:** 4 toggle switch, disabled kalau role viewer, kirim command via Socket.IO/REST, tampilkan status loading sampai `command_ack` diterima
- **Dependency:** Task 3.5, Task 4.6

### Task 4.8 — Tab History (Grafik + Filter Waktu)
- **Status:** TODO
- **Output:** grafik line chart suhu & RPM dengan filter 1 jam/24 jam/7 hari, fetch dari `GET /devices/:id/history`
- **Dependency:** Task 3.6, Task 4.6

### Task 4.9 — Tab Aktivitas (Event Log)
- **Status:** TODO
- **Output:** list log aktivitas (relay toggle, klaim, akses berubah, online/offline) dari `GET /devices/:id/events`
- **Dependency:** Task 3.6, Task 4.6

### Task 4.10 — Tab Kelola Akses (khusus Owner)
- **Status:** TODO
- **Output:** list user dengan akses + role, form undang user baru by email, tombol ubah/cabut akses
- **Dependency:** Task 2.5, Task 4.6

### Task 4.11 — Filter "Alat Saya" vs "Dibagikan ke Saya"
- **Status:** TODO
- **Output:** tab/filter di dashboard berdasarkan role user di tiap device
- **Dependency:** Task 4.4

### Task 4.12 — Panel Admin (khusus Superadmin)
- **Status:** TODO
- **Output:** halaman list semua device (claimed/unclaimed + owner), tombol generate device baru (modal tampilkan device_code+secret sekali), list & kelola role user
- **Dependency:** Task 2.2, Task 2.6, Task 4.3

---

## FASE 5 — Firmware ESP32

### Task 5.1 — Buat `config.h` template
- **Status:** TODO
- **Output:** file config terpisah berisi WiFi credential, MQTT broker info, device_code, device_secret (per unit)
- **Dependency:** Task 3.7 (butuh tahu skema auth final)

### Task 5.2 — Tambah koneksi WiFi ke sketch
- **Status:** TODO
- **Output:** fungsi `setupWiFi()` + auto-reconnect, dipanggil di `setup()`, tidak mengubah logic relay/tombol yang sudah ada
- **Dependency:** Task 5.1

### Task 5.3 — Tambah koneksi MQTT ke sketch
- **Status:** TODO
- **Output:** fungsi `setupMQTT()`, koneksi pakai device_code/secret, set LWT ke topik status, auto-reconnect
- **Dependency:** Task 5.2, Task 3.7

### Task 5.4 — Publish Telemetry
- **Status:** TODO
- **Output:** modifikasi `handleTemperature()`/`handleSpeedSensor()` (atau fungsi baru terpisah) untuk susun JSON payload dan publish ke topik telemetry tiap interval
- **Dependency:** Task 5.3

### Task 5.5 — Subscribe & Handle Command
- **Status:** TODO
- **Output:** `mqttCallback()` untuk terima command `set_relay`, panggil fungsi toggle relay yang sudah dimodifikasi supaya bisa dipanggil dari command (bukan hanya dari tombol fisik), publish `command/ack`
- **Dependency:** Task 5.4

### Task 5.6 — Refactor blocking `delay()` jadi non-blocking
- **Status:** TODO
- **Output:** pastikan `mqttClient.loop()` tidak terblokir oleh `delay()` di buzzer/toggle relay (pakai `millis()` timing seperti pola yang sudah dipakai di `handleButtons()`)
- **Dependency:** Task 5.5

### Task 5.7 — Testing end-to-end dengan 1 unit fisik
- **Status:** TODO
- **Output:** alat fisik berhasil connect, data muncul live di dashboard, kontrol relay dari web berhasil eksekusi ke alat
- **Dependency:** semua task Fase 5, Fase 4 selesai

---

## FASE 6 — Deployment

### Task 6.1 — Setup VPS (Node, PostgreSQL, Mosquitto, Nginx)
- **Status:** TODO
- **Dependency:** semua fase development selesai/cukup matang untuk deploy awal

### Task 6.2 — Setup domain + HTTPS (Let's Encrypt) + reverse proxy Nginx
- **Status:** TODO
- **Dependency:** Task 6.1

### Task 6.3 — Setup MQTT TLS di production (port 8883)
- **Status:** TODO
- **Dependency:** Task 6.1, Task 3.7

### Task 6.4 — Deploy backend & frontend build ke VPS
- **Status:** TODO
- **Dependency:** Task 6.2

### Task 6.5 — Replikasi firmware ke semua unit alat
- **Status:** TODO
- **Dependency:** Task 5.7, Task 6.3

---

## RINGKASAN PROGRESS

| Fase | Total Task | Selesai |
|---|---|---|
| Fase 0 — Fondasi | 3 | 3 |
| Fase 1 — Auth | 4 | 4 |
| Fase 2 — Device & Klaim | 6 | 6 |
| Fase 3 — MQTT & Real-time | 7 | 0 |
| Fase 4 — Frontend | 12 | 0 |
| Fase 5 — Firmware | 7 | 0 |
| Fase 6 — Deployment | 5 | 0 |
| **TOTAL** | **44** | **13** |

> Update tabel ini setiap kali sebuah task pindah status jadi DONE, supaya progress keseluruhan gampang dipantau.

---

## CATATAN UNTUK AI/DEV YANG MENGERJAKAN

- Kerjakan **1 task per sesi/prompt**. Sebutkan nomor task-nya (mis. "kerjakan Task 2.3") saat minta AI mulai.
- Setelah task selesai, AI wajib melaporkan: file apa saja yang dibuat/diubah, cara testing manual (kalau ada), dan apakah ada penyesuaian dari rancangan awal.
- Kalau suatu task ternyata butuh keputusan tambahan (belum ada di rancangan awal), AI harus tanya dulu sebelum lanjut, bukan asumsi sendiri.
- Jangan kerjakan task yang dependency-nya belum DONE.