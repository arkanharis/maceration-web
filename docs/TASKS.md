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
- **Status:** DONE
- **Output:** service yang connect ke Mosquitto sebagai admin/backend client, subscribe wildcard `maceration/+/telemetry`, `maceration/+/status`, dan `maceration/+/command/ack`
- **Files dibuat/diubah:**
  - `src/config/mqtt.js` — baru, singleton MQTT client (mqtt.connect) dengan auto-reconnect setiap 3 detik
  - `src/services/mqttService.js` — baru, wire event connect/reconnect/error/message; dispatch ke handler berdasarkan topic type; expose `initMqttHandlers()` dan `publishCommand()` (untuk Task 3.5)
  - `src/index.js` — import mqtt config (trigger koneksi), panggil `initMqttHandlers` dengan placeholder callbacks
  - `package.json` — tambah dependency `mqtt`
- **Dependency:** Task 0.3

### Task 3.2 — Handler Telemetry → Simpan DB + Broadcast
- **Status:** DONE
- **Output:** saat terima pesan telemetry, parse payload, insert ke `device_logs`, update `devices.last_seen_at`, broadcast `telemetry_update` via Socket.IO ke room device tsb
- **Files dibuat/diubah:**
  - `src/repositories/deviceLogRepository.js` — baru, `insertLog()` + `listLogsForDevice()` (untuk Task 3.6)
  - `src/config/socket.js` — baru, singleton Socket.IO (`initSocketIO`, `getIO`); CORS-configurable; room subscription detail ditambah di Task 3.4
  - `src/services/telemetryService.js` — baru, `handleTelemetry()`: resolve device_code→id (cache 1 menit), parallel `insertLog` + `touchDeviceLastSeen`, broadcast `telemetry_update` ke room
  - `src/index.js` — ganti `app.listen` dengan `http.createServer` + `initSocketIO`; pasang `handleTelemetry` sebagai MQTT handler nyata
  - `package.json` — tambah dependency `socket.io`
- **Dependency:** Task 3.1, Task 2.1

### Task 3.3 — Handler Status Online/Offline
- **Status:** DONE
- **Output:** update `devices.connection_status`, insert ke `device_events`, broadcast `device_status_changed`
- **Files dibuat/diubah:**
  - `src/services/deviceCache.js` — baru, shared TTL cache `device_code → UUID` (dipakai telemetryService & statusService, hindari N+1 DB hit per detik); expose `resolveDeviceId()` + `evictDeviceCache()`
  - `src/services/statusService.js` — baru, `handleStatus()`: validasi state, resolve ID, `updateDeviceConnectionStatus`, `logEvent` (device_online/device_offline), broadcast `device_status_changed`
  - `src/services/telemetryService.js` — refactor: gunakan shared `deviceCache` (hapus local cache duplikat)
  - `src/index.js` — import & wire `handleStatus` sebagai `onStatus` handler nyata
- **Dependency:** Task 3.2

### Task 3.4 — Setup Socket.IO Server & Room per Device
- **Status:** DONE
- **Output:** event `subscribe_device`/`unsubscribe_device` dengan permission check (pakai `getUserRoleForDevice`), join/leave room
- **Files dibuat/diubah:**
  - `src/config/socket.js` — full rewrite: JWT auth middleware (`authenticateSocket`) dipasang sebagai `_io.use()`; handler `subscribe_device` (validasi device exist, cek role via `getUserRoleForDevice`, join room, acknowledge dengan role); handler `unsubscribe_device` (leave room); log connect/disconnect per user
- **Test:** 6/6 passed (no token → rejected, invalid token → rejected, valid token → connected, subscribe owned device → role returned, subscribe inaccessible device → access denied, unsubscribe → OK)
- **Dependency:** Task 2.4, Task 3.1

### Task 3.5 — Endpoint/Event Kirim Command (Kontrol Relay)
- **Status:** DONE
- **Output:** `POST /api/v1/devices/:id/command` DAN event Socket.IO `send_command` — cek role owner/operator, publish ke topik `command`, tunggu/handle `command/ack`
- **Files dibuat/diubah:**
  - `src/services/commandService.js` — baru: pending-ack map dengan timeout 8 detik, `sendCommand()` (validasi input + permission + publish + wait ack + log event + broadcast `command_ack` ke room), `resolveCommandAck()` (dipanggil saat MQTT ack masuk)
  - `src/controllers/commandController.js` — baru: handler `POST /devices/:id/command`
  - `src/routes/deviceRoutes.js` — tambah route `POST /:id/command`
  - `src/config/socket.js` — tambah event `send_command` (jalur realtime, memanggil `sendCommand()` yang sama)
  - `src/index.js` — wire `resolveCommandAck` sebagai `onCommandAck` MQTT handler
- **Test:** 3/3 passed (valid command+ack via fake ESP32, viewer denied 403, invalid relay 400)
- **Dependency:** Task 3.4, Task 2.5

### Task 3.6 — Endpoint History & Events
- **Status:** DONE
- **Output:** `GET /api/v1/devices/:id/history?from&to`, `GET /api/v1/devices/:id/events`
- **Files dibuat/diubah:**
  - `src/services/historyService.js` — baru: `getDeviceHistory()` (cek akses, validasi range max 30 hari, default 1 jam terakhir) dan `getDeviceEvents()` (cek akses, limit max 500)
  - `src/controllers/historyController.js` — baru: handler `getHistory` dan `getEvents`
  - `src/routes/deviceRoutes.js` — tambah `GET /:id/history` dan `GET /:id/events`
- **Test:** events menampilkan 10 event (relay_toggled, device_online/offline, access_revoked); validasi range error mengembalikan 400
- **Dependency:** Task 3.2

### Task 3.7 — MQTT Auth & ACL (Device-level)
- **Status:** DONE
- **Output:** setup auth plugin Mosquitto via HTTP webhook supaya device hanya bisa connect dengan `device_code`+`device_secret_hash` valid, dan ACL: device hanya boleh publish/subscribe ke topik miliknya sendiri
- **Files dibuat/diubah:**
  - `src/repositories/mqttAuthRepository.js` — baru: `authenticateDeviceCredentials()` (query + bcrypt.compare device_secret_hash) dan `isTopicAllowed()` (ACL rules per-device)
  - `src/controllers/mqttAuthController.js` — baru: `POST /mqtt/auth` (backend superuser via env secret, device via DB) dan `POST /mqtt/acl` (allow-all backend, per-device topic check)
  - `src/routes/mqttAuthRoutes.js` — baru: route `/mqtt/auth` dan `/mqtt/acl`
  - `src/index.js` — register `mqttAuthRoutes`, tambah `express.urlencoded()` untuk form-encoded bodies
  - `mosquitto-prod/mosquitto.conf` — baru: konfigurasi production dengan plugin `mosquitto-go-auth` HTTP backend + Redis cache
  - `mosquitto-prod/docker-compose.yml` — baru: `iegomez/mosquitto-go-auth` image + Redis service
  - `mosquitto-dev/mosquitto.conf` — update comment ke arah folder mosquitto-prod/
  - `backend/.env` — tambah `MQTT_BACKEND_PASSWORD`
- **ACL rules:** device boleh PUBLISH telemetry/status/command/ack ke topik sendiri; boleh SUBSCRIBE command topik sendiri; semua cross-device diblokir
- **Test:** 11/11 ACL rules passed (auth superuser, wrong pass, unknown device, 5 allowed, 3 denied)
- **Catatan:** ini bagian security penting, jangan skip sebelum production
- **Dependency:** Task 3.1, Task 2.2

---

## FASE 4 — Frontend

### Task 4.1 — Setup Routing & Layout Dasar
- **Status:** DONE
- **Output:** React Router setup (`react-router-dom`), layout dengan Navbar + Sidebar (kondisional tampilkan menu superadmin), design system tokens di `index.css` & Google Fonts (Lora, Plus Jakarta Sans, JetBrains Mono), halaman skeleton untuk tiap route (`/login`, `/register`, `/`, `/devices`, `/devices/:id`, `/admin`, 404).
- **Files dibuat/diubah:**
  - `frontend/index.html` — import Google Fonts (Lora, Plus Jakarta Sans, JetBrains Mono)
  - `frontend/src/index.css` — import Tailwind v4 & setup visual identity tokens (`#F9F8F3` parchment, `#F1F0EA` surface, `#1A1A1A` charcoal, `#D97736` amber gold, `#3A5F43` sage green, `#C84B31` terracotta, crisp borders & lab-card utilities)
  - `frontend/src/components/Navbar.jsx` — header brand "MACERATION.LAB", badge role user, button logout
  - `frontend/src/components/Sidebar.jsx` — navigasi lab (Dashboard, Alat Saya, Dibagikan), menu Superadmin kondisional, indicator MQTT broker
  - `frontend/src/components/Layout.jsx` — wrapper Navbar + Sidebar + `<Outlet />`
  - `frontend/src/pages/` — `LoginPage.jsx`, `RegisterPage.jsx`, `DashboardPage.jsx`, `DeviceDetailPage.jsx`, `AdminPage.jsx`, `NotFoundPage.jsx`
  - `frontend/src/App.jsx` — setup `BrowserRouter` dan nested routes
  - `frontend/package.json` — tambah dependency `react-router-dom`, `lucide-react`, `socket.io-client`, `recharts`
- **Test:** `npm run build` sukses (1.98s, 0 error)
- **Dependency:** Task 0.1

### Task 4.2 — Halaman Login & Register
- **Status:** DONE
- **Output:** Form login & register dengan state management, handling loading/error alert, terintegrasi dengan REST API (`POST /auth/login` & `POST /auth/register`) & `AuthContext`, redirect ke dashboard/halaman yang diminta setelah sukses.
- **Files dibuat/diubah:**
  - `frontend/src/pages/LoginPage.jsx` — form email & password, error handling, redirect ke `state.from` / `/`
  - `frontend/src/pages/RegisterPage.jsx` — form nama, email, & password (min 6 karakter), error handling, redirect ke `/`
- **Dependency:** Task 1.2, Task 4.1

### Task 4.3 — Auth Context & Protected Routes
- **Status:** DONE
- **Output:** `AuthContext` React (menyimpan state `user`, `token`, `login`, `register`, `logout`), otentikasi awal berbasis `localStorage`, persentensi sesi (`GET /auth/me`), `ProtectedRoute` component untuk me-redirect user yang belum login ke `/login` dan membatasi rute `/admin` khusus superadmin, serta client helper (`apiFetch`).
- **Files dibuat/diubah:**
  - `frontend/src/services/api.js` — wrapper `apiFetch` (otomatis menyematkan `Authorization: Bearer <token>` dari localStorage) & auth endpoints helper (`login`, `register`, `getMe`)
  - `frontend/src/context/AuthContext.jsx` — `AuthProvider` & `useAuth` custom hook
  - `frontend/src/components/ProtectedRoute.jsx` — guard rute publik/terproteksi/superadmin dengan loading spinner
  - `frontend/src/App.jsx` — membungkus rute dengan `<AuthProvider>` dan `<ProtectedRoute>`
- **Test:** `npm run build` sukses (1.97s, 0 error)
- **Dependency:** Task 4.2

### Task 4.4 — Dashboard Utama (List Device)
- **Status:** DONE
- **Output:** Halaman grid kartu instrumen (nama, kode, status online/offline dengan live pulse, preview telemetri suhu & RPM, badge role Owner/Operator/Viewer), filter tab (Semua/Milik Saya/Dibagikan), search bar, & listener real-time Socket.IO (`telemetry_update` & `device_status_changed`).
- **Files dibuat/diubah:**
  - `frontend/src/services/api.js` — tambah `deviceApi` endpoints (`getDevices`, `getDevice`, `claimDevice`, `updateDevice`, `releaseDevice`, `sendCommand`, `getHistory`, `getEvents`, `getAccessList`, dll)
  - `frontend/src/services/socket.js` — Socket.IO client manager dengan token handshake & auto-reconnect
  - `frontend/src/components/DeviceCard.jsx` — kartu instrumen berdesain *Digital Apothecary* (JetBrains Mono angka, Lora serif judul, Sage Green & Amber Gold badges)
  - `frontend/src/pages/DashboardPage.jsx` — halaman utama dashboard dengan state management & Socket.IO listener
- **Test:** `npm run build` sukses (1.79s, 0 error)
- **Dependency:** Task 2.4, Task 4.3

### Task 4.5 — Modal Klaim Alat
- **Status:** DONE
- **Output:** Modal dialog berbasis lab-card aesthetic untuk klaim alat baru (input `device_code` seperti `MC-0001`), panggil REST API `POST /devices/claim`, validasi input, alert error/sukses, & auto-refresh list device setelah klaim.
- **Files dibuat/diubah:**
  - `frontend/src/components/ClaimDeviceModal.jsx` — modal dialog klaim alat baru
  - `frontend/src/pages/DashboardPage.jsx` — integrasi modal klaim dengan tombol "+ Klaim Alat Baru"
- **Test:** `npm run build` sukses (1.79s, 0 error)
- **Dependency:** Task 2.3, Task 4.4

### Task 4.6 — Halaman Detail Alat: Live Data Panel
- **Status:** DONE
- **Output:** Detail instrumen dengan header (nama, `device_code`, connection status `ONLINE/OFFLINE` dengan live pulse dot, last seen time), stat cards (suhu °C & RPM), & koneksi Socket.IO real-time (otomatis join room `subscribe_device` `{ deviceId }`, dengarkan `telemetry_update` & `device_status_changed`).
- **Files dibuat/diubah:**
  - `frontend/src/pages/DeviceDetailPage.jsx` — halaman detail alat utama dengan Socket.IO room subscription & state telemetry real-time
- **Test:** `npm run build` sukses (2.51s, 0 error)
- **Dependency:** Task 3.4, Task 4.4

### Task 4.7 — Halaman Detail Alat: Kontrol Relay
- **Status:** DONE
- **Output:** 4 toggle switch (R1 Heater, R2 Stirrer Motor, R3 Solenoid Valve, R4 Aux), disabled jika alat offline atau role `viewer`, mengirim perintah sakelar via Socket.IO (`send_command`) dengan fallback REST API (`POST /devices/:id/command`), & animasi loading spinner di sakelar saat menunggu ACK (`command_ack`).
- **Files dibuat/diubah:**
  - `frontend/src/components/device/RelayControlPanel.jsx` — komponen sakelar relay 4-saluran
  - `frontend/src/pages/DeviceDetailPage.jsx` — integrasi tab Kontrol Relay Live
- **Test:** `npm run build` sukses (2.51s, 0 error)
- **Dependency:** Task 3.5, Task 4.6

### Task 4.8 — Tab History (Grafik + Filter Waktu)
- **Status:** DONE
- **Output:** Grafik line chart suhu (°C) & RPM dengan Recharts, disesuaikan estetika *Digital Apothecary* (garis Sage Green `#3A5F43` & Amber Gold `#D97736`, custom JetBrains Mono tooltip), & filter rentang waktu (1 Jam, 24 Jam, 7 Hari) dari REST API `GET /devices/:id/history`.
- **Files dibuat/diubah:**
  - `frontend/src/components/device/TelemetryChart.jsx` — komponen grafik histori Recharts dengan range filter
  - `frontend/src/pages/DeviceDetailPage.jsx` — integrasi tab Riwayat Sensor (Grafik)
- **Test:** `npm run build` sukses (2.51s, 0 error)
- **Dependency:** Task 3.6, Task 4.6

### Task 4.9 — Tab Aktivitas (Event Log)
- **Status:** DONE
- **Output:** Daftar rekaman audit trail (`relay_toggled`, `device_online`, `device_offline`, `access_granted`, `access_revoked`, `device_claimed`), timestamps format `JetBrains Mono`, detail event, & tombol refresh dari REST API `GET /devices/:id/events`.
- **Files dibuat/diubah:**
  - `frontend/src/components/device/ActivityLogTab.jsx` — komponen tab log aktivitas instrumen
  - `frontend/src/pages/DeviceDetailPage.jsx` — integrasi tab Log Aktivitas
- **Test:** `npm run build` sukses (2.51s, 0 error)
- **Dependency:** Task 3.6, Task 4.6

### Task 4.10 — Tab Kelola Akses & Edit/Lepas Alat (khusus Owner)
- **Status:** DONE
- **Output:** Tab khusus owner untuk ubah nama alat (`PATCH /devices/:id`), daftar pengguna berbagi akses (`GET /devices/:id/access`), form undang user baru (`POST /devices/:id/access`), ubah role `operator/viewer` (`PATCH /devices/:id/access/:userId`), cabut akses (`DELETE /devices/:id/access/:userId`), & danger zone lepas alat (`DELETE /devices/:id`).
- **Files dibuat/diubah:**
  - `frontend/src/components/device/AccessControlTab.jsx` — komponen kelola akses & bahaya lepas alat
  - `frontend/src/pages/DeviceDetailPage.jsx` — integrasi tab Kelola Akses & Pengaturan (kondisional owner)
- **Test:** `npm run build` sukses (2.51s, 0 error)
- **Dependency:** Task 2.5, Task 4.6

### Task 4.11 — Filter "Alat Saya" vs "Dibagikan ke Saya"
- **Status:** DONE
- **Output:** Filter tab di dashboard utama (*Semua Instrumen*, *Milik Saya (Owner)*, *Dibagikan ke Saya (Operator/Viewer)*) yang menyaring kartu alat secara instan berbasis URL search query `?filter=owned` dan `?filter=shared`.
- **Files dibuat/diubah:**
  - `frontend/src/pages/DashboardPage.jsx` — tab filter berbasis `useSearchParams`
  - `frontend/src/components/Sidebar.jsx` — link navigasi filter cepat
- **Test:** `npm run build` sukses (2.51s, 0 error)
- **Dependency:** Task 4.4

### Task 4.12 — Panel Admin (khusus Superadmin)
- **Status:** DONE
- **Output:** Halaman administrasi sistem (`/admin`), daftar seluruh instrumen sistem (`GET /admin/devices`), modal generate device baru (`POST /admin/devices`) dengan tampilan `device_code` & `device_secret` plaintext **SEKALI SAJA** beserta tombol salin & peringatan keamanan, serta daftar pengguna global & dropdown ubah `global_role` (`superadmin` <-> `user`).
- **Files dibuat/diubah:**
  - `frontend/src/pages/AdminPage.jsx` — halaman lengkap panel administrasi superadmin
  - `frontend/src/services/api.js` — tambah `adminApi` endpoints (`getDevices`, `generateDevice`, `getUsers`, `updateUserRole`)
- **Test:** `npm run build` sukses (2.51s, 0 error)
- **Dependency:** Task 2.2, Task 2.6, Task 4.3

---

## FASE 5 — Firmware ESP32

### Task 5.1–5.6 — Firmware ESP32 (WiFi, MQTT, Telemetry, Command, Non-blocking)
- **Status:** DONE
- **Output:** `firmware/config.h` + `firmware/maceration.ino` lengkap dengan semua fitur konektivitas
- **Files dibuat/diubah:**
  - `firmware/config.h` — konstanta statis saja (pin, interval, nama AP portal); credential TIDAK hardcode
  - `firmware/maceration.ino` — firmware lengkap:
    - **WiFiManager** (tzapu): captive portal AP "Maceration-Setup" untuk konfigurasi WiFi + MQTT Broker + Device Code + Device Secret via browser — tidak perlu hardcode, semua disimpan ke NVS (Preferences)
    - **Factory reset**: tahan GPIO 0 (tombol BOOT) 3 detik → hapus semua konfigurasi, restart, portal muncul lagi
    - **MQTT**: LWT online/offline (retained), subscribe `command`, publish `telemetry` tiap 1 detik, publish `command/ack` setelah eksekusi relay
    - **`setRelay(idx, value)`**: dapat dipanggil dari command MQTT maupun tombol fisik
    - **`publishTelemetry()`**: JSON `{temperature, rpm, relay:{r1-r4}, ts}`
    - **`mqttCallback()`**: parse `set_relay` command, map r1-r4 → idx, eksekusi relay, publish ack
    - **Non-blocking buzzer**: millis state machine (MELODY_STARTUP, RELAY_BEEP, WIFI_OK, MQTT_OK, ERROR)
    - **Auto-reconnect**: WiFi (`WiFi.reconnect()`) + MQTT (coba ulang tiap 5 detik)
  - `firmware/.gitignore` — exclude build artifacts
- **Library yang diperlukan** (install via Arduino Library Manager):
  - `WiFiManager` by tzapu
  - `PubSubClient` by Nick O'Leary
  - `ArduinoJson` by Benoit Blanchon (v6.x)
  - `OneWire` by Paul Stoffregen
  - `DallasTemperature` by Miles Burton
- **Alur konfigurasi unit baru:**
  1. Flash firmware
  2. Boot → ESP32 buka AP "Maceration-Setup" (pass: `setup1234`)
  3. Connect ke AP dari HP/laptop → browser otomatis buka portal (atau manual ke 192.168.4.1)
  4. Isi: WiFi SSID+Pass, MQTT Broker IP, Port, Device Code (dari admin dashboard), Device Secret
  5. Submit → ESP32 restart → langsung online
- **Dependency:** Task 3.7, Task 2.2

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
| Fase 3 — MQTT & Real-time | 7 | 7 |
| Fase 4 — Frontend | 12 | 12 |
| Fase 5 — Firmware | 7 | 6 |
| Fase 6 — Deployment | 5 | 0 |
| **TOTAL** | **44** | **38** |

> Update tabel ini setiap kali sebuah task pindah status jadi DONE, supaya progress keseluruhan gampang dipantau.

---

## CATATAN UNTUK AI/DEV YANG MENGERJAKAN

- Kerjakan **1 task per sesi/prompt**. Sebutkan nomor task-nya (mis. "kerjakan Task 2.3") saat minta AI mulai.
- Setelah task selesai, AI wajib melaporkan: file apa saja yang dibuat/diubah, cara testing manual (kalau ada), dan apakah ada penyesuaian dari rancangan awal.
- Kalau suatu task ternyata butuh keputusan tambahan (belum ada di rancangan awal), AI harus tanya dulu sebelum lanjut, bukan asumsi sendiri.
- Jangan kerjakan task yang dependency-nya belum DONE.