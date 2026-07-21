# Rancangan Website Monitoring & Kontrol IoT — Maceration Controller

**Stack:** Node.js (Express) + Socket.IO + PostgreSQL + Mosquitto (MQTT) + React (Vite) + Tailwind
**Skala target:** <10 alat, <20 pengguna
**Live update:** sub-detik (ESP32 → MQTT → Backend → WebSocket → Browser)

---

## 1. ARSITEKTUR SISTEM

```
┌─────────────┐      MQTT (TLS)       ┌──────────────────┐
│  ESP32       │ ───────────────────▶ │  Mosquitto Broker  │
│  Maceration  │ ◀─────────────────── │  (di VPS)          │
│  Controller  │   (perintah relay)    └─────────┬─────────┘
└─────────────┘                                  │
                                        subscribe/publish
                                                  │
                                       ┌──────────▼──────────┐
                                       │   Backend (Node.js)  │
                                       │   - MQTT client       │
                                       │   - REST API          │
                                       │   - Socket.IO server  │
                                       │   - Auth (JWT)         │
                                       └───┬──────────────┬───┘
                                           │              │
                                 ┌─────────▼───┐   ┌──────▼────────┐
                                 │ PostgreSQL   │   │ Socket.IO      │
                                 │ (data & log) │   │ (live push)    │
                                 └──────────────┘   └──────┬────────┘
                                                            │
                                                  ┌─────────▼─────────┐
                                                  │  React Dashboard    │
                                                  │  (browser user)     │
                                                  └─────────────────────┘
```

**Alur data live:**
1. ESP32 baca sensor (suhu, RPM, status relay) → publish ke topik MQTT setiap ~1 detik.
2. Backend subscribe topik itu → simpan ke DB (opsional, untuk history) → sekaligus broadcast langsung ke browser via Socket.IO (tanpa nunggu simpan DB, biar tetap cepat).
3. Browser terima event Socket.IO → update UI real-time (grafik, angka, status relay) tanpa reload/polling.

**Alur kontrol (user klik tombol relay di web):**
1. Browser kirim request via Socket.IO/REST ke backend.
2. Backend cek permission (apakah user punya akses Owner/Operator ke alat itu).
3. Backend publish perintah ke topik MQTT khusus command untuk device tsb.
4. ESP32 subscribe topik command → eksekusi relay → publish balik status terbaru → siklus live update di atas berulang.

---

## 2. SKEMA DATABASE (PostgreSQL)

### Tabel `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | bcrypt |
| global_role | ENUM('superadmin','user') | role global |
| created_at | TIMESTAMP | |

### Tabel `devices`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| device_code | VARCHAR UNIQUE | contoh `MC-0001`, dicetak di stiker alat |
| device_secret_hash | VARCHAR | hash dari secret (jangan simpan plaintext) |
| name | VARCHAR | nama custom dari user, mis. "Maceration Tank 1" |
| status | ENUM('unclaimed','claimed') | |
| connection_status | ENUM('online','offline') | update otomatis dari last heartbeat |
| last_seen_at | TIMESTAMP | |
| owner_id | UUID (FK → users.id, nullable) | terisi setelah diklaim |
| created_at | TIMESTAMP | saat digenerate admin |
| claimed_at | TIMESTAMP nullable | |

### Tabel `device_access` (berbagi akses alat)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| device_id | UUID (FK → devices.id) | |
| user_id | UUID (FK → users.id) | |
| role | ENUM('owner','operator','viewer') | |
| granted_by | UUID (FK → users.id) | siapa yang share akses ini |
| created_at | TIMESTAMP | |

> Kombinasi (device_id, user_id) harus UNIQUE — satu user hanya punya satu role per alat.

### Tabel `device_logs` (history sensor, untuk grafik)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGSERIAL (PK) | |
| device_id | UUID (FK) | |
| temperature | FLOAT | |
| rpm | INT | |
| relay_state | JSONB | contoh `{"r1":true,"r2":false,"r3":false,"r4":true}` |
| recorded_at | TIMESTAMP | |

> Untuk skala kecil, tabel biasa cukup. Kalau nanti data membengkak, tinggal ubah jadi TimescaleDB hypertable tanpa ubah struktur aplikasi.

### Tabel `device_events` (log aktivitas penting, audit trail)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGSERIAL (PK) | |
| device_id | UUID (FK) | |
| user_id | UUID nullable | null kalau event dari sistem/alat sendiri |
| event_type | VARCHAR | mis. `relay_toggled`, `device_claimed`, `access_granted`, `device_offline` |
| detail | JSONB | |
| created_at | TIMESTAMP | |

---

## 3. DESAIN MQTT TOPIC & PAYLOAD

**Struktur topik** (per device, pakai `device_code` supaya mudah dibaca):

```
maceration/{device_code}/telemetry     → alat publish data sensor (QoS 1)
maceration/{device_code}/status        → alat publish online/offline (retained, LWT)
maceration/{device_code}/command       → backend publish perintah ke alat (QoS 1)
maceration/{device_code}/command/ack   → alat konfirmasi command sudah dieksekusi
```

**Payload `telemetry`** (dikirim tiap ±1 detik):
```json
{
  "temperature": 32.5,
  "rpm": 850,
  "relay": { "r1": true, "r2": false, "r3": false, "r4": true },
  "ts": 1721000000
}
```

**Payload `status`** (retained + Last Will and Testament):
```json
{ "state": "online", "ip": "192.168.1.50", "ts": 1721000000 }
```
> LWT diset saat connect: kalau koneksi ESP32 putus mendadak, broker otomatis publish `{"state":"offline"}` ke topik ini. Ini penting supaya dashboard tahu alat mati tanpa harus nunggu timeout.

**Payload `command`** (dari backend ke alat):
```json
{ "action": "set_relay", "relay": "r2", "value": true, "request_id": "abc123" }
```

**Payload `command/ack`** (konfirmasi dari alat):
```json
{ "request_id": "abc123", "success": true, "relay": { "r1": true, "r2": true, "r3": false, "r4": true } }
```

**Autentikasi MQTT per device:**
- Username = `device_code` (mis. `MC-0001`), Password = `device_secret` (plaintext dikirim lewat TLS, disimpan sebagai hash di server).
- Mosquitto pakai plugin auth (mis. `mosquitto-go-auth`) yang cek ke PostgreSQL langsung, atau versi paling praktis: backend Node.js jalan sebagai auth service kecil untuk Mosquitto (`mosquitto_auth_plugin` via HTTP webhook).
- **ACL**: tiap device hanya boleh publish/subscribe ke topik dengan `device_code` miliknya sendiri (dicegah lewat ACL Mosquitto), supaya alat A tidak bisa kirim data mengaku-aku sebagai alat B.

---

## 4. DESAIN REST API

Base URL: `/api/v1`

### Auth
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/register` | daftar user baru |
| POST | `/auth/login` | login → return JWT |
| POST | `/auth/logout` | |
| GET | `/auth/me` | data user yang sedang login |

### Devices
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/devices` | user login | list semua alat yang bisa diakses user (owner/operator/viewer) |
| GET | `/devices/:id` | akses ke device tsb | detail 1 alat + status terkini |
| POST | `/devices/claim` | user login | body: `{ device_code }` → klaim alat unclaimed jadi milik user (owner) |
| PATCH | `/devices/:id` | owner | ubah nama alat |
| DELETE | `/devices/:id` | owner | hapus/lepas alat dari akun (device jadi unclaimed lagi) |
| POST | `/devices/:id/command` | owner/operator | body: `{ action, relay, value }` → kirim command via MQTT |
| GET | `/devices/:id/history` | akses ke device | query param `from`,`to` → data grafik dari `device_logs` |
| GET | `/devices/:id/events` | owner/operator | audit log aktivitas alat |

### Device Access (sharing)
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/devices/:id/access` | owner | list siapa saja yang punya akses ke alat ini |
| POST | `/devices/:id/access` | owner | body: `{ email, role }` → share akses ke user lain (by email) |
| PATCH | `/devices/:id/access/:userId` | owner | ubah role user tsb (operator↔viewer) |
| DELETE | `/devices/:id/access/:userId` | owner | cabut akses |

### Admin (superadmin only)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/admin/devices` | list semua alat di sistem (termasuk unclaimed) |
| POST | `/admin/devices` | generate device baru → return `{ device_code, device_secret }` (secret hanya tampil sekali!) |
| GET | `/admin/users` | list semua user |
| PATCH | `/admin/users/:id` | ubah global_role user |

---

## 5. WEBSOCKET EVENTS (Socket.IO)

**Client → Server:**
- `subscribe_device` `{ deviceId }` — join room untuk terima update device tsb (server cek permission dulu)
- `unsubscribe_device` `{ deviceId }`
- `send_command` `{ deviceId, action, relay, value }` — alternatif realtime untuk kontrol relay tanpa REST round-trip

**Server → Client:**
- `telemetry_update` `{ deviceId, temperature, rpm, relay, ts }` — dikirim tiap kali ada data baru dari MQTT
- `device_status_changed` `{ deviceId, status: 'online'|'offline' }`
- `command_ack` `{ deviceId, requestId, success, relay }`
- `access_changed` `{ deviceId }` — supaya UI refresh kalau akses user diubah/dicabut owner saat sedang online

> Room Socket.IO dibuat per `deviceId`, sehingga broadcast hanya ke user yang memang subscribe ke alat itu (efisien, tidak broadcast ke semua orang).

---

## 6. DESAIN HALAMAN / UI

### 6.1 Halaman Login / Register
- Form email + password, validasi standar.
- Link "Lupa password" (opsional untuk versi awal).

### 6.2 Dashboard Utama (setelah login)
- **Grid/list kartu alat** — tiap kartu menampilkan:
  - Nama alat, status online/offline (indikator warna hijau/abu-abu)
  - Preview singkat: suhu terkini, RPM terkini
  - Badge role Anda di alat itu (Owner/Operator/Viewer)
- Tombol **"+ Tambah Alat"** → buka modal klaim alat (input Device ID).
- Filter/search kalau alat banyak.

### 6.3 Halaman Detail Alat
- **Header**: nama alat, status online/offline, last seen.
- **Panel live data** (update real-time via Socket.IO):
  - Angka suhu besar + mini grafik garis (Recharts) — history beberapa menit terakhir.
  - Angka RPM + mini grafik.
  - 4 toggle switch untuk relay (disabled kalau role Viewer, aktif kalau Owner/Operator).
- **Tab History**: grafik lebih lengkap dengan filter rentang waktu (1 jam / 24 jam / 7 hari).
- **Tab Aktivitas**: log siapa toggle relay kapan, kapan alat online/offline (dari `device_events`).
- **Tab Kelola Akses** (khusus Owner):
  - List user yang punya akses + role masing-masing.
  - Form "Undang user baru" — input email + pilih role (Operator/Viewer).
  - Tombol cabut akses / ubah role per user.
- **Tombol "Lepas Alat"** (khusus Owner) — dengan konfirmasi, device kembali jadi unclaimed.

### 6.4 Halaman "Alat Saya" vs "Dibagikan ke Saya"
- Dua tab/filter di dashboard: alat yang dimiliki sendiri (Owner) vs alat yang di-share orang lain ke Anda (Operator/Viewer) — supaya jelas mana yang benar-benar milik user.

### 6.5 Panel Admin (khusus Superadmin)
- List semua alat di sistem + status (claimed/unclaimed) + siapa ownernya.
- Tombol "Generate Device Baru" → modal menampilkan `device_code` + `device_secret` **sekali saja** dengan peringatan "catat sekarang, tidak akan ditampilkan lagi" (untuk dimasukkan ke `config.h` firmware).
- List semua user + kelola role global.

---

## 7. TAMBAHAN FIRMWARE ESP32 (yang perlu ditulis di atas kode Anda)

Kode `maceration.ino` yang ada sekarang murni kerja lokal (relay, tombol, sensor, buzzer) via Serial saja — belum ada konektivitas. Yang perlu ditambahkan:

1. **`config.h`** (terpisah, isi per-unit sebelum flash):
```cpp
#define WIFI_SSID     "nama-wifi"
#define WIFI_PASSWORD "password-wifi"
#define MQTT_BROKER   "your-vps-domain.com"
#define MQTT_PORT     8883   // TLS
#define DEVICE_CODE   "MC-0001"
#define DEVICE_SECRET "xxxxxxxxxxxxxxxx"  // digenerate dari dashboard admin
```

2. **Library tambahan**: `WiFi.h` (built-in ESP32), `PubSubClient.h` atau `WiFiClientSecure` + MQTT client untuk TLS.

3. **Fungsi baru yang perlu ditambahkan ke sketch:**
   - `setupWiFi()` — connect ke WiFi, reconnect otomatis kalau putus.
   - `setupMQTT()` — connect ke broker pakai `DEVICE_CODE`/`DEVICE_SECRET` sebagai username/password, set LWT ke topik `status`.
   - `publishTelemetry()` — dipanggil tiap interval (gabung dengan `handleTemperature()`/`handleSpeedSensor()` yang sudah ada), susun payload JSON, publish ke topik `telemetry`.
   - `mqttCallback()` — subscribe topik `command`, saat terima pesan `set_relay`, panggil `toggleRelay()` yang sudah ada (sedikit dimodifikasi supaya bisa dipanggil dari command MQTT, bukan cuma dari tombol fisik) lalu publish `command/ack`.
   - Non-blocking `loop()` — perlu hati-hati karena kode existing pakai beberapa `delay()` (di buzzer & toggle relay), ini bisa memblokir `mqttClient.loop()`. Solusinya, buzzer beep dibuat non-blocking atau minimal `delay()` diperpendek.

> Ini adalah pekerjaan firmware terpisah yang saya bisa bantu tuliskan lengkap setelah rancangan web ini disepakati — supaya sinkron persis dengan topik MQTT & format payload di atas.

---

## 8. RINGKASAN KEPUTUSAN DESAIN

| Aspek | Keputusan |
|---|---|
| Protokol alat↔server | MQTT (Mosquitto self-host di VPS) |
| Live update ke browser | Socket.IO (WebSocket), room per-device |
| Backend | Node.js + Express + Socket.IO + mqtt.js |
| Database | PostgreSQL |
| Frontend | React (Vite) + Tailwind + Recharts |
| Auth | JWT + bcrypt |
| Role global | superadmin, user |
| Role per-alat | owner, operator, viewer |
| Provisioning ID | Digenerate manual dari dashboard admin sebelum produksi, hardcode ke `config.h` |
| Klaim alat | User input manual Device ID (dari stiker) di dashboard |
| Hosting | VPS (backend+DB+broker) + domain + HTTPS (Let's Encrypt) |

---

## 9. LANGKAH SELANJUTNYA (usulan urutan pengerjaan)

1. Setup VPS: install PostgreSQL, Mosquitto, Node.js, Nginx (reverse proxy + HTTPS).
2. Buat skema database + migrasi.
3. Bangun backend: auth → device CRUD → MQTT bridge → Socket.IO.
4. Bangun firmware tambahan ESP32 (WiFi+MQTT) berdasarkan topik/payload di atas.
5. Bangun frontend: login → dashboard → detail alat (live data) → kelola akses.
6. Testing end-to-end dengan 1 alat fisik dulu, baru replikasi ke unit lain.

---

*Dokumen ini adalah rancangan awal. Detail skema DB, API, dan firmware bisa disesuaikan lebih lanjut sesuai temuan saat implementasi.*
