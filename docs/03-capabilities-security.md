# 🛡️ 03. Sistem Kapabilitas & Keamanan (Security & Sandbox)

WagonBox menerapkan model keamanan **Zero-Trust Sandbox**. Artinya, modul pihak ketiga tidak diperbolehkan langsung mengakses filesystem sistem operasi (`/etc`, `/root`, dll.) atau menjalankan sembarang perintah shell tanpa izin resmi.

Semua akses harus melewati **Capability Broker** yang mengontrol izin berdasarkan apa yang dideklarasikan di `manifest.json`.

---

## 🔐 Daftar Kapabilitas Inti (*Core Capabilities*)

Berikut adalah daftar izin resmi yang bisa kamu minta di dalam array `requestedCapabilities` di `manifest.json`:

| Nama Kapabilitas | Apa yang Bisa Dilakukan? | Contoh Penggunaan |
| :--- | :--- | :--- |
| **`shell.execute`** | Menjalankan perintah Linux biner host | Menjalankan `systemctl`, `docker`, `nginx -t` |
| **`storage.read`** | Membaca file dari workspace modul | Membaca log atau cache internal modul |
| **`storage.write`** | Menulis file baru atau menimpa file di workspace modul | Menyimpan laporan, template, atau backup data |
| **`storage.list`** | Melihat daftar file/folder di workspace modul | Menampilkan list file yang tersimpan |
| **`storage.remove`** | Menghapus file di workspace modul | Membersihkan file sementara (*temp files*) |
| **`config.read`** | Membaca data konfigurasi modul dari database terenkripsi | Mengambil API Key atau pengaturan port |
| **`config.write`** | Menyimpan data konfigurasi modul ke database terenkripsi | Menyimpan preferensi pengguna |
| **`api.register`** | Mendaftarkan endpoint REST API publik ke WagonBox | Membuat route `/api/v1/ext/<namespace>/...` |
| **`api.call`** | Memanggil endpoint API milik Core atau modul lain | Integrasi antar-modul di WagonBox |

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

## 🎯 Selanjutnya

Yuk pelajari cara memakai 4 Gateway utama di [**04. Referensi Lengkap Gateway**](./04-gateways-reference.md).
