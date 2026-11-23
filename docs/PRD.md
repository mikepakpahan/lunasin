# Product Requirements Document (PRD)

| Atribut         | Detail                                                                           |
| :-------------- | :------------------------------------------------------------------------------- |
| **Nama Proyek** | Lunasin                                                                          |
| **Versi**       | 1.1 (Revisi Arsitektur & Skema Matang)                                           |
| **Tanggal**     | 23 November 2026                                                                 |
| **Arsitektur**  | Laravel Monolith (REST API `/api/v1`) + React (Vite) + Tailwind CSS + shadcn/ui |

---

## 1. Latar Belakang & Tujuan

### 1.1 Latar Belakang
Aktivitas patungan dan titip beli (terutama makanan melalui layanan pesan-antar atau makan bersama di kantor, kos, dan komunitas) sering menghadapi kendala administratif:
1. Perhitungan pembagian ongkos kirim, diskon promo, pajak restoran (PB1), dan biaya layanan yang rumit jika dihitung manual.
2. Penagih (*Payer*) kesulitan melacak siapa saja yang sudah mentransfer atau belum.
3. Kerumitan verifikasi transfer manual tanpa bukti yang terpusat.
4. Keengganan teman yang ditagih (*Participant*) untuk mengunduh aplikasi atau membuat akun baru hanya untuk membayar satu kali tagihan.

### 1.2 Tujuan Produk
Membangun aplikasi web manajemen *split bill* yang **dinamis, transparan, dan minim friksi**:
- Pihak penagih (*Payer*) memiliki dashboard rapi untuk menginput struk, membagi item, dan memvalidasi pembayaran.
- Pihak yang ditagih (*Participant / Guest*) dapat melihat rincian transparan dan mengonfirmasi pembayaran langsung melalui *Shareable Link* tanpa perlu mendaftar akun (*Zero-friction Guest Access*).
- Menyediakan format ringkasan teks otomatis yang siap disalin ke grup WhatsApp.

---

## 2. Target Pengguna & Peran (Roles)

| Peran | Deskripsi | Hak Akses Sistem |
| :--- | :--- | :--- |
| **Payer (Pengguna Terdaftar)** | Orang yang menalangi transaksi, membuat tagihan, menginput item, menyebarkan tautan, dan memverifikasi pembayaran. | Wajib login (Email & Password). Mengelola profil pembayaran, grup pertemanan, dan siklus hidup tagihan (*draft*, *locked*, *settled*). |
| **Participant (Tamu / Guest)** | Anggota lingkaran pertemanan yang ditagih bagiannya. | **Tidak wajib login.** Mengakses tagihan melalui *Shareable Link* unik (`/b/{share_token}`). Mengonfirmasi transfer melalui token klaim aman (`claim_token`). |

---

## 3. Arsitektur & Stack Teknologi

- **Backend:** Laravel 11 / 12 (PHP 8.3+) sebagai penyedia REST API (`/api/v1/...`) dengan Laravel Sanctum (Stateful Cookie untuk Web SPA, siap Personal Access Token untuk mobile client masa depan).
- **Frontend:** React berjalan di dalam repositori monolitik Laravel (dikelola Vite), menggunakan React Router, Tailwind CSS, dan shadcn/ui (estetika minimalis ala Luma, *mobile-first*).
- **Database:** PostgreSQL / MySQL (dukungan SQLite untuk local testing & CI).
- **Penyimpanan Berkas:** Laravel Storage (`public` disk) untuk menampung gambar QRIS statis dan bukti transfer.

---

## 4. Ruang Lingkup Fitur

### 4.1 Fase 1 — Minimum Viable Product (MVP Matang)
1. **Autentikasi & Profil Metode Pembayaran:**
   - Registrasi, login, logout, dan manajemen profil.
   - Manajemen multi-rekening pembayaran: Bank transfer (BCA, Mandiri, BRI, dll.), E-Wallet (GoPay, OVO, Dana), dan upload QRIS statis Payer.
2. **Manajemen Circle / Grup:**
   - Pembuatan grup pertemanan (contoh: *"Magang Kantor"*, *"Teman Kos"*) untuk menyimpan kontak anggota tetap agar proses input tagihan berikutnya instan.
3. **Itemized Split Bill Engine:**
   - Input judul struk, pilihan grup (opsional), tanggal transaksi.
   - Input daftar item: nama makanan/barang, harga satuan, dan kuantitas.
   - Penugasan porsi item (*item allocation*) ke satu atau lebih peserta (termasuk porsi Payer sendiri).
   - Pengaturan biaya tambahan: Pajak Restoran (PB1), Service Charge, Ongkos Kirim, Biaya Layanan Aplikasi, dan Diskon/Voucher.
   - Metode pembagian biaya fleksibel (Pajak/Service proporsional, Ongkir/Biaya aplikasi bagi rata atau proporsional).
   - Konservasi uang (*zero-loss rounding*): selisih pembulatan rupiah dialokasikan secara transparan.
4. **Siklus Hidup Tagihan & Penguncian (*Bill Locking*):**
   - Status tagihan: `open` (draft), `locked` (sudah dibagikan, kalkulasi terkunci), `settled` (semua peserta lunas), `cancelled`.
   - Mengunci tagihan secara otomatis atau manual agar kalkulasi tidak bergeser saat pembayaran mulai masuk.
5. **Akses Publik & Keamanan Anti-Tampering:**
   - Akses publik via `/b/{share_token}` yang responsif di ponsel.
   - Verifikasi konfirmasi bayar per peserta menggunakan `claim_token` unik untuk mencegah manipulasi data antar peserta (Anti-IDOR).
   - Opsi upload bukti transfer gambar (opsional / tidak memaksa).
6. **Verifikasi & Pelacakan Pembayaran:**
   - Payer dapat menerima (`verify`) atau menolak (`reject` dengan catatan) konfirmasi pembayaran peserta.
   - Status per peserta: `unpaid`, `pending` (menunggu verifikasi Payer), `paid`, `rejected`.
7. **Generator Ringkasan WhatsApp:**
   - Menghasilkan format teks rapi dengan satu klik tombol "Salin ke WhatsApp" (berisi rincian per orang, nomor rekening Payer, dan link struk online).

### 4.2 Fase 2 — Pengembangan Lanjutan (Out of Scope MVP)
- Rekapitulasi saldo utang-piutang kumulatif antar anggota dalam satu grup (*group balance settlement*).
- Pemindaian struk otomatis berbasis OCR (OpenAI Vision / Google Cloud Document AI).
- Integrasi pembayaran otomatis (Virtual Account / QRIS Dinamis via Payment Gateway).
- Aplikasi Mobile (Flutter / React Native).

---

## 5. Aturan Bisnis & Logika Perhitungan

### 5.1 Tipe Data Mata Uang
Seluruh nominal moneter (harga satuan, subtotal, pajak, diskon, dan total tagihan) wajib disimpan dalam satuan **Integer Rupiah** (IDR tanpa desimal) di database dan API untuk menghindari galat kalkulasi *floating-point*.

### 5.2 Posisi Payer sebagai Partisipan
Payer otomatis dicatat ke dalam tabel `bill_participants` dengan penanda `is_payer = true`:
- Jika Payer ikut memesan item, porsi Payer dihitung secara adil bersama peserta lain.
- Status pembayaran porsi Payer otomatis `paid` sejak awal, sehingga sisa tagihan yang belum lunas murni merupakan tanggungan peserta tamu.

### 5.3 Alur Distribusi Biaya Tambahan & Diskon (Hybrid Model)
Biaya tambahan dan diskon dibagi berdasarkan karakteristik aslinya:
1. **Pajak (PB1) & Service Charge Restoran:**
   Secara *default* dihitung secara **Proporsional** terhadap subtotal konsumsi masing-masing orang:
   $$\text{Tax/Service Peserta } i = \left(\frac{\text{Subtotal Pesanan } i}{\text{Total Subtotal Pesanan Seluruh Peserta}}\right) \times (\text{Pajak} + \text{Service})$$
2. **Ongkos Kirim & Biaya Layanan Aplikasi:**
   Dapat dipilih oleh Payer:
   - **Bagi Rata (Equal / Default):** Dibagi sama rata kepada seluruh peserta aktif yang memiliki pesanan.
     $$\text{Ongkir per Peserta} = \frac{\text{Total Ongkos Kirim}}{\text{Jumlah Peserta Aktif}}$$
   - **Proporsional:** Dibagi mengikuti persentase porsi belanja.
3. **Diskon Promo / Voucher:**
   Dihitung secara proporsional terhadap subtotal pesanan agar peserta yang berbelanja lebih banyak mendapatkan potongan lebih besar secara adil.

### 5.4 Penanganan Pembulatan & Konservasi Nilai Uang (*Zero-Loss Rounding*)
- Pembagian proporsional yang menghasilkan pecahan desimal dibulatkan ke nilai bulat terdekat.
- Agar total tagihan seluruh peserta ditambah bagian Payer sama persis ($100\%$) dengan nilai struk riil (`total_amount`), sistem menggunakan algoritma alokasi sisa pembulatan (*Largest Remainder Method* / Hare-Niemeyer):
  $$\sum \text{total\_owed peserta} + \text{total\_owed payer} = \text{bills.total\_amount}$$
- Selisih penyesuaian dicatat pada kolom `bills.rounding_amount`.

### 5.5 Pembagian Porsi Item Bersama (*Shared Items*)
Pada tabel pivot `bill_item_participant`, porsi dialokasikan menggunakan kolom `allocated_quantity` (tipe desimal):
- Contoh 1: 1 porsi Pizza dimakan berdua oleh A dan B $\rightarrow$ masing-masing mendapat `allocated_quantity = 0.5`.
- Contoh 2: Item "Es Teh" (Kuantitas total struk: 3) dipesan oleh A (2 gelas) dan B (1 gelas) $\rightarrow$ A mendapat `allocated_quantity = 2`, B mendapat `allocated_quantity = 1`.
- Validasi: $\sum \text{allocated\_quantity} \le \text{bill\_items.quantity}$.

---

## 6. Rancangan Skema Database

```
+------------------+       +-------------------------+
|      users       |       |  user_payment_methods   |
+------------------+       +-------------------------+
| id               |<-----\| id                      |
| name             |       | user_id (FK)            |
| email            |       | type (bank/ewallet/qris)|
| password         |       | provider_name           |
| phone            |       | account_number          |
+------------------+       | account_holder_name     |
         |                 | qr_image_path           |
         | 1:N             | is_default              |
         v                 +-------------------------+
+------------------+       +-------------------------+
|      groups      |       |      group_members      |
+------------------+       +-------------------------+
| id               |<-----\| id                      |
| user_id (FK)     |       | group_id (FK)           |
| name             |       | name                    |
| description      |       | phone                   |
+------------------+       +-------------------------+
         |                             |
         | 1:N                         | 1:N (nullable)
         v                             v
+----------------------------------------------------+
|                       bills                        |
+----------------------------------------------------+
| id                                                 |
| user_id (FK)                                       |
| group_id (FK, nullable)                            |
| title                                              |
| share_token (unique, 12 chars)                     |
| subtotal                                           |
| tax_amount                                         |
| service_fee                                        |
| delivery_fee                                       |
| discount_amount                                    |
| fee_split_method (equal, proportional)             |
| rounding_amount                                    |
| total_amount                                       |
| is_locked (boolean)                                |
| status (open, settled, cancelled)                  |
+----------------------------------------------------+
         |                           |
         | 1:N                       | 1:N
         v                           v
+-----------------------+   +------------------------+
|   bill_participants   |   |       bill_items       |
+-----------------------+   +------------------------+
| id                    |   | id                     |
| bill_id (FK)          |   | bill_id (FK)           |
| group_member_id (FK)  |   | name                   |
| name                  |   | price                  |
| is_payer (boolean)    |   | quantity               |
| claim_token (unique)  |   +------------------------+
| subtotal_owed         |                |
| fees_owed             |                |
| discount_received     |                |
| total_owed            |                |
| payment_status        |                |
| proof_image_path      |                |
| rejection_reason      |                |
| paid_at               |                |
+-----------------------+                |
         |                               |
         |         bill_item_participant |
         +------------------------------>|
           - id                          |
           - bill_item_id (FK)           |
           - bill_participant_id (FK)    |
           - allocated_quantity (dec)    |
```

### 6.1 Rincian Kamus Data

#### 1. `users`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | Auto increment |
| `name` | VARCHAR(255) | Nama lengkap Payer |
| `email` | VARCHAR(255) | Unik, untuk kredensial login |
| `password` | VARCHAR(255) | Hash Bcrypt / Argon2 |
| `phone` | VARCHAR(50) | Nullable, nomor kontak Payer |
| `created_at` / `updated_at` | TIMESTAMP | Standar Laravel |

#### 2. `user_payment_methods`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | Auto increment |
| `user_id` | BIGINT (FK) | Berelasi ke `users.id` (ON DELETE CASCADE) |
| `type` | ENUM | `'bank'`, `'ewallet'`, `'qris'` |
| `provider_name` | VARCHAR(50) | Contoh: `BCA`, `Mandiri`, `GoPay`, `QRIS Statis` |
| `account_number` | VARCHAR(100) | Nullable (wajib jika `bank` / `ewallet`) |
| `account_holder_name` | VARCHAR(255) | Nullable, nama pemilik rekening / e-wallet |
| `qr_image_path` | VARCHAR(255) | Nullable, path gambar QRIS statis |
| `is_default` | BOOLEAN | Penanda rekening utama (default: `false`) |
| `created_at` / `updated_at` | TIMESTAMP | Standar Laravel |

#### 3. `groups`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | Auto increment |
| `user_id` | BIGINT (FK) | Pemilik grup (berelasi ke `users.id`) |
| `name` | VARCHAR(100) | Nama grup (contoh: *"Magang Frontend"*) |
| `description` | TEXT | Nullable, deskripsi singkat grup |
| `created_at` / `updated_at` | TIMESTAMP | Standar Laravel |

#### 4. `group_members`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | Auto increment |
| `group_id` | BIGINT (FK) | Berelasi ke `groups.id` (ON DELETE CASCADE) |
| `name` | VARCHAR(100) | Nama panggilan anggota |
| `phone` | VARCHAR(50) | Nullable, nomor telepon untuk auto-fill kontak |
| `created_at` / `updated_at` | TIMESTAMP | Standar Laravel |

#### 5. `bills`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | Auto increment |
| `user_id` | BIGINT (FK) | Payer penanggung jawab (`users.id`) |
| `group_id` | BIGINT (FK) | Nullable, asosiasi ke grup jika ada |
| `title` | VARCHAR(255) | Judul struk/transaksi (contoh: *"Makan Siang Padang"*) |
| `share_token` | VARCHAR(20) | Unik, string acak URL-safe (10-16 karakter) |
| `subtotal` | INT | Total harga murni seluruh item (sebelum diskon & biaya) |
| `tax_amount` | INT | Total pajak PB1 (default: 0) |
| `service_fee` | INT | Biaya layanan resto / platform (default: 0) |
| `delivery_fee` | INT | Ongkos kirim (default: 0) |
| `discount_amount` | INT | Total potongan voucher/diskon (default: 0) |
| `fee_split_method` | ENUM | `'equal'`, `'proportional'` (default: `'equal'`) |
| `rounding_amount` | INT | Selisih koreksi pembulatan rupiah (default: 0) |
| `total_amount` | INT | Total tagihan riil struk yang harus dibayar |
| `is_locked` | BOOLEAN | Mencegah pengubahan item saat pembayaran sudah berjalan |
| `status` | ENUM | `'open'`, `'settled'`, `'cancelled'` (default: `'open'`) |
| `created_at` / `updated_at` | TIMESTAMP | Standar Laravel |

#### 6. `bill_participants`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | Auto increment |
| `bill_id` | BIGINT (FK) | Berelasi ke `bills.id` (ON DELETE CASCADE) |
| `group_member_id` | BIGINT (FK) | Nullable, jejak relasi ke anggota grup |
| `name` | VARCHAR(100) | Nama peserta pada struk ini |
| `is_payer` | BOOLEAN | Menandai porsi Payer sendiri (default: `false`) |
| `claim_token` | VARCHAR(32) | Unik, token acak aman untuk aksi guest (Anti-IDOR) |
| `subtotal_owed` | INT | Subtotal harga item yang dipesan peserta |
| `fees_owed` | INT | Akumulasi porsi pajak, service, dan ongkir peserta |
| `discount_received`| INT | Porsi potongan harga yang diterima peserta |
| `total_owed` | INT | Total akhir yang wajib ditransfer peserta |
| `payment_status` | ENUM | `'unpaid'`, `'pending'`, `'paid'`, `'rejected'` |
| `proof_image_path` | VARCHAR(255) | Nullable, path gambar struk bukti transfer |
| `rejection_reason` | VARCHAR(255) | Nullable, alasan penolakan bukti oleh Payer |
| `paid_at` | TIMESTAMP | Nullable, waktu pembayaran diverifikasi Payer |
| `created_at` / `updated_at` | TIMESTAMP | Standar Laravel |

#### 7. `bill_items`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | Auto increment |
| `bill_id` | BIGINT (FK) | Berelasi ke `bills.id` (ON DELETE CASCADE) |
| `name` | VARCHAR(255) | Nama menu/barang |
| `price` | INT | Harga satuan barang dalam Rupiah |
| `quantity` | INT | Jumlah pesanan (default: 1) |
| `created_at` / `updated_at` | TIMESTAMP | Standar Laravel |

#### 8. `bill_item_participant` (Pivot)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | Auto increment |
| `bill_item_id` | BIGINT (FK) | Berelasi ke `bill_items.id` (ON DELETE CASCADE) |
| `bill_participant_id`| BIGINT (FK) | Berelasi ke `bill_participants.id` (ON DELETE CASCADE) |
| `allocated_quantity` | DECIMAL(5,2) | Porsi jumlah pesanan yang ditanggung (contoh: `1.00`, `0.50`) |
| `created_at` / `updated_at` | TIMESTAMP | Standar Laravel |

---

## 7. Rancangan Endpoint REST API (`/api/v1`)

Semua respons API menggunakan format JSON standar:
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": {},
  "meta": {}
}
```

### 7.1 Autentikasi & Akun (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Registrasi Payer baru (nama, email, password, no. telepon).
- `POST /api/v1/auth/login` — Autentikasi & inisiasi session/token Sanctum.
- `POST /api/v1/auth/logout` — Revoke token / invalidate session.
- `GET /api/v1/auth/me` — Ambil profil Payer yang sedang login.

### 7.2 Manajemen Metode Pembayaran Payer (`/api/v1/profile/payment-methods`)
- `GET /api/v1/profile/payment-methods` — Daftar seluruh rekening/e-wallet/QRIS milik Payer.
- `POST /api/v1/profile/payment-methods` — Menambah metode pembayaran baru (mendukung upload gambar QRIS).
- `PUT /api/v1/profile/payment-methods/{id}` — Memperbarui data rekening atau mengganti gambar QRIS.
- `DELETE /api/v1/profile/payment-methods/{id}` — Menghapus metode pembayaran.
- `PATCH /api/v1/profile/payment-methods/{id}/default` — Menjadikan metode ini sebagai rekening utama.

### 7.3 Grup & Kontak Lingkaran Pertemanan (`/api/v1/groups`)
- `GET /api/v1/groups` — Mengambil daftar grup milik Payer.
- `POST /api/v1/groups` — Membuat grup baru.
- `GET /api/v1/groups/{id}` — Mengambil detail grup beserta daftar anggotanya.
- `PUT /api/v1/groups/{id}` — Mengubah nama atau deskripsi grup.
- `DELETE /api/v1/groups/{id}` — Menghapus grup beserta relasi anggotanya.
- `POST /api/v1/groups/{id}/members` — Menambahkan anggota baru ke dalam grup.
- `PUT /api/v1/groups/{id}/members/{memberId}` — Memperbarui data anggota (nama / nomor HP).
- `DELETE /api/v1/groups/{id}/members/{memberId}` — Menghapus anggota dari grup.

### 7.4 Tagihan / Bills — Area Payer (`/api/v1/bills`)
- `GET /api/v1/bills` — Riwayat tagihan Payer (bisa difilter status: `open`, `settled`).
- `POST /api/v1/bills` — Membuat tagihan baru beserta item, alokasi partisipan, dan kalkulasi otomatis via `BillCalculatorService`.
- `GET /api/v1/bills/{id}` — Detail lengkap tagihan untuk dashboard Payer.
- `PUT /api/v1/bills/{id}` — Memperbarui rincian struk/item (hanya diizinkan jika `is_locked = false`).
- `DELETE /api/v1/bills/{id}` — Menghapus tagihan.
- `POST /api/v1/bills/{id}/lock` — Mengunci tagihan secara manual agar tidak bisa diedit lagi.
- `GET /api/v1/bills/{id}/whatsapp-text` — Mengambil teks ringkasan tagihan yang siap disalin ke grup WhatsApp.
- `PATCH /api/v1/bills/{id}/participants/{participantId}/verify` — Payer memverifikasi transfer peserta (mengubah status ke `paid`).
- `POST /api/v1/bills/{id}/participants/{participantId}/reject` — Payer menolak konfirmasi transfer peserta (mengubah status ke `rejected` disertai pesan `rejection_reason`).

### 7.5 Akses Publik — Area Peserta / Guest (`/api/v1/public/bills`)
- `GET /api/v1/public/bills/{share_token}`
  - Publik, tanpa autentikasi.
  - Mengembalikan rincian struk, status tagihan, daftar seluruh peserta & status bayarnya, serta opsi pembayaran Payer (nomor rekening & gambar QRIS).
  - *Security Note:* Nilai `claim_token` peserta tidak dibocorkan pada response publik secara terbuka, melainkan dikomunikasikan secara aman atau disediakan lewat tautan individual.
- `POST /api/v1/public/bills/{share_token}/confirm`
  - Publik dengan proteksi token dan *Rate Limiting*.
  - Payload: `{ claim_token: "string", proof_image: File|null }`.
  - Mengubah status peserta pemilik `claim_token` menjadi `pending` dan menyimpan berkas bukti transfer.

---

## 8. Kebutuhan Non-Fungsional & Keamanan

### 8.1 Keamanan Anti-Tampering & Privasi
1. **Pencegahan IDOR (Insecure Direct Object Reference):**
   Aksi konfirmasi pembayaran tamu (`/confirm`) wajib menyertakan `claim_token` unik 32-karakter. Pengguna tidak bisa menandai pembayaran milik peserta lain hanya dengan menebak ID urut integer.
2. **Rate Limiting Ketat:**
   Endpoint publik dilindungi middleware rate limit Laravel (maksimal 10 request per menit per alamat IP) untuk mencegah *brute-force* atau penyerangan *storage flooding* melalui upload gambar bukti bayar.
3. **Validasi Berkas Ketat:**
   Unggahan QRIS dan bukti transfer wajib divalidasi:
   - Format yang diterima: `jpeg`, `jpg`, `png`, `webp`.
   - Ukuran maksimal: 2 MB.
   - Disimpan dengan penamaan acak terenkripsi (bukan nama file asli) di storage privat/publik Laravel.

### 8.2 Desain UI/UX (Mobile-First)
- Halaman publik `/b/{share_token}` harus dioptimasi untuk layar smartphone (viewport 360px - 430px) karena lebih dari 90% akses berasal dari klik tautan di aplikasi WhatsApp.
- Tombol aksi utama (*Call to Action*):
  - Peserta: Tombol salin nomor rekening (dengan feedback *copy to clipboard* instan), pratinjau gambar QRIS yang bisa diperbesar (*modal preview*), dan tombol "Konfirmasi Sudah Transfer".
  - Payer: Tombol "Salin Ringkasan WhatsApp" yang memformat tagihan dengan rapi dan ramah dibaca di chat.

### 8.3 Format Contoh Generator Teks WhatsApp
```text
🧾 *TAGIHAN: Makan Siang Padang*
Total Struk: Rp125.000

Rincian Patungan:
1. Budi: Rp35.000 (Lunas ✅)
2. Siti: Rp28.000 (Menunggu Verifikasi ⏳)
3. Andi: Rp32.000 (Belum Bayar ❌)

💳 *Pembayaran via:*
• BCA: 1234567890 a.n. John Doe
• GoPay: 08123456789

Detail struk & konfirmasi transfer:
https://lunasin.app/b/xK9dLa82Pq
```
