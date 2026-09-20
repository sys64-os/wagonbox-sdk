# 🛡️ 03. Sistem Kapabilitas & Keamanan (Security & Sandbox)

WagonBox menerapkan model keamanan **Zero-Trust Sandbox**. Artinya, modul pihak ketiga tidak diperbolehkan langsung mengakses filesystem sistem operasi (`/etc`, `/root`, dll.) atau menjalankan sembarang perintah shell tanpa izin resmi.

Semua akses harus melewati **Capability Broker** yang mengontrol izin berdasarkan apa yang dideklarasikan di `manifest.json`.

---

## 🔐 Daftar Kapabilitas Inti (*Core Capabilities*)

Berikut adalah daftar izin resmi yang bisa kamu minta di dalam array `requestedCapabilities` di `manifest.json`:

| Nama Kapabilitas | Apa yang Bisa Dilakukan? | Contoh Penggunaan |
| :--- | :--- | :--- |
| **`shell.execute`** | Menjalankan perintah Linux biner host | `systemctl`, `docker`, `nginx -t` |
| **`storage.read`** | Membaca file dari workspace modul | Membaca log/cache internal |
| **`storage.write`** | Menulis file di workspace modul | Menyimpan laporan/backup |
| **`storage.list`** | Melihat daftar file/folder di workspace | List file tersimpan |
| **`storage.remove`** | Menghapus file di workspace | Bersihkan temp files |
| **`config.read`** | Membaca konfigurasi terenkripsi | Mengambil API Key/port |
| **`config.write`** | Menyimpan konfigurasi terenkripsi | Menyimpan preferensi |
| **`api.register`** | Mendaftarkan endpoint REST API | Route `/api/v1/ext/<ns>/...` |
| **`api.call`** | Memanggil API Core/modul lain | Integrasi antar-modul |
| **`system.read`** | Baca info sistem | `system.info` |
| **`system.manage`** | Kelola sistem | Restart service |
| **`network.read`** | Baca jaringan | `network.interfaces()` |
| **`network.configure`** | Konfigurasi jaringan (nmcli) | `network.configure()` |
| **`storage.configure`** | Kelola volume LVM | `storageMgmt.createVolume()` |
| **`user.read`** | Baca user | `users.list()` |
| **`user.manage`** | Kelola user/SSH | `users.create()` |
| **`file.read`** | Baca file system-wide | `files.read('/etc/hosts')` |
| **`file.write`** | Tulis file system-wide | `files.write()` |
| **`terminal.execute`** | Terminal PTY | `terminal.spawn()` |
| **`license.read`** | Baca lisensi | `license.status()` |
| **`license.activate`** | Aktivasi lisensi | `license.activate()` |
| **`cluster.read`** | Baca cluster | `cluster` |
| **`cluster.manage`** | Kelola cluster | Join/remove node |
| **`audit.read`** | Baca/record audit | `audit.record()` |
| **`modules.read`** | Baca modul | `modules.list()` |
| **`modules.manage`** | Kelola modul | Enable/disable |

---

## 📝 Cara Meminta Izin di `manifest.json`

Kamu cukup menuliskan kapabilitas yang kamu butuhkan saja (*Principle of Least Privilege*):

```json
{
  "name": "wagonbox-my-plugin",
  "version": "1.0.0",
  "requestedCapabilities": [
    "shell.execute",
    "storage.read",
    "storage.write",
    "config.read",
    "api.register"
  ]
}
```

> ⚠️ **PENTING:** Jika kodemu memanggil fitur yang izinnya tidak ada di `manifest.json`, WagonBox Core akan langsung melempar error `CAPABILITY_DENIED` dan memblokir panggilan tersebut!

---

## 🛡️ Lapisan Proteksi Keamanan Bawaan

SDK dan Core WagonBox sudah dilengkapi lapisan pertahanan otomatis:

### 1. Anti-Command Injection (Pada Shell Gateway)
Modul **tidak boleh** memasukkan string perintah panjang dengan simbol-simbol berbahaya seperti `;`, `|`, `&&`, `$()`, atau backtick ``` ` ```.
- ❌ **Ditolak:** `this.shell.execute('rm -rf /; echo test')`
- ✅ **Diterima:** `this.shell.execute('echo', ['halo dunia'])`

### 2. Anti-Path Traversal (Pada Storage Gateway)
Modul **hanya memiliki akses** ke foldernya sendiri di `/opt/wagonbox/data/<nama-modul>/`. Modul tidak bisa kabur ke folder lain menggunakan `../` atau path absolut root.
- ❌ **Ditolak:** `this.storage.read('../../etc/shadow')`
- ❌ **Ditolak:** `this.storage.read('/var/log/messages')`
- ✅ **Diterima:** `this.storage.read('cache/status.json')`

### 3. Namespace Isolation (Pada API Gateway)
Setiap modul memiliki namespace sendiri yang terdaftar di `apiNamespace`. Modul tidak bisa membajak route milik Core atau modul lain.

---

## 🔍 Mengecek Izin di Dalam Kode

Di dalam class modul, kamu bisa mengecek apakah izin tertentu diberikan atau belum menggunakan method pembantu:

```javascript
// Cek apakah punya izin shell
if (this.hasCapability('shell.execute')) {
  await this.shell.execute('uptime', []);
} else {
  console.warn('Modul tidak memiliki izin shell.execute');
}

// Atau paksa harus ada izin (akan throw error jika tidak ada)
this.requireCapability('storage.write');
await this.storage.write('data.txt', 'isi data');
```

---

### 4. Structured Errors (api.md §39)

Semua error Core memakai `WagonboxError` (`lib/errors.js`): `CAPABILITY_DENIED`, `LICENSE_REQUIRED`, `STEP_UP_REQUIRED`, dll. dengan `ERROR_HTTP_STATUS`.

## 🎯 Selanjutnya

Yuk pelajari cara memakai 12 Gateway di [**04. Referensi Lengkap Gateway**](./04-gateways-reference.md).
