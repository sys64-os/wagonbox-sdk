# 🔌 04. Referensi Lengkap Gateway

Di bab ini, kita akan bedah 4 Gateway utama yang bisa kamu akses langsung dari `this` di dalam class `WagonboxModule`.

---

## 1. 🐚 Shell Gateway (`this.shell`)

Digunakan untuk mengeksekusi binary Linux di host OS secara aman.

> 🔑 **Izin yang dibutuhkan**: `shell.execute`

### Method Utama: `execute(command, args, options)`

```javascript
const result = await this.shell.execute('systemctl', ['is-active', 'nginx'], {
  timeout: 5000,           // Batas waktu eksekusi dalam ms (default: 30000)
  cwd: '/opt/wagonbox',    // Working directory (opsional)
  env: { FOO: 'bar' }      // Environment variable tambahan (opsional)
});

console.log(result.stdout);   // Output standar (string)
console.log(result.stderr);   // Output error (string)
console.log(result.exitCode); // Kode keluar (number: 0 jika sukses)
```

### Method Tambahan: `spawn(command, args, options)`
Untuk proses yang berjalan di latar belakang (*streaming/long-running*):

```javascript
const handle = await this.shell.spawn('ping', ['-c', '4', '8.8.8.8']);
console.log('PID Process:', handle.pid);
```

---

## 2. 🗄️ Storage Gateway (`this.storage`)

Digunakan untuk operasi file di dalam folder terisolasi modul (`/opt/wagonbox/data/<module-id>/`).

> 🔑 **Izin yang dibutuhkan**: `storage.read`, `storage.write`, `storage.list`, `storage.remove`

### Contoh Penggunaan Operasi File:

```javascript
// 1. Menulis file teks atau JSON
await this.storage.write('laporan/januari.json', JSON.stringify({ total: 100 }));

// 2. Membaca file
const data = await this.storage.read('laporan/januari.json');
console.log(JSON.parse(data));

// 3. Mengecek apakah file/folder ada
const exists = await this.storage.exists('laporan/januari.json');

// 4. Membuat folder baru
await this.storage.mkdir('backup/temp');

// 5. Melihat daftar file dalam folder
const files = await this.storage.list('laporan');
console.log(files); // ['januari.json', ...]

// 6. Mendapatkan informasi ukuran & waktu modifikasi file
const info = await this.storage.stat('laporan/januari.json');
console.log(info.size, info.mtime);

// 7. Menyalin & Memindahkan file
await this.storage.copy('laporan/januari.json', 'backup/januari-copy.json');
await this.storage.move('backup/januari-copy.json', 'backup/januari-final.json');

// 8. Menghapus file
await this.storage.remove('backup/januari-final.json');
```

---

## 3. ⚙️ Config Gateway (`this.config`)

Digunakan untuk menyimpan konfigurasi atau pengaturan modul ke database terenkripsi Core WagonBox (SQLCipher/SQLite).

> 🔑 **Izin yang dibutuhkan**: `config.read`, `config.write`

### Contoh Penggunaan Config:

```javascript
// Menyimpan konfigurasi (bisa string, number, boolean, atau object)
await this.config.set('api_key', 'sk-live-123456789');
await this.config.set('max_retries', 3);
await this.config.set('notification_settings', { email: true, telegram: false });

// Mengambil konfigurasi
const apiKey = await this.config.get('api_key');
const maxRetries = await this.config.get('max_retries') ?? 5; // dengan default fallback

// Menghapus konfigurasi
await this.config.delete('api_key');

// Mengambil seluruh konfigurasi modul sekaligus
const allConfig = await this.config.all();
console.log(allConfig);
```

---

## 4. 🌐 API Client Gateway (`this.registerRoute` & `this.api`)

Digunakan untuk membuka REST API publik agar Web UI atau aplikasi eksternal bisa berkomunikasi dengan modulmu.

> 🔑 **Izin yang dibutuhkan**: `api.register`, `api.call`

### Mendaftarkan Endpoint REST API:

```javascript
async onStart() {
  // GET /api/v1/ext/<namespace>/users
  await this.registerRoute('GET', '/users', 'handleGetUsers');

  // POST /api/v1/ext/<namespace>/users
  await this.registerRoute('POST', '/users', 'handleCreateUser');
}

// Method handler harus dideklarasikan di dalam class yang sama
async handleGetUsers(params) {
  return { users: ['admin', 'operator'] };
}

async handleCreateUser(params) {
  // params berisi body payload yang dikirim klien
  console.log('Data baru:', params);
  return { ok: true, id: 123 };
}
```

### Memanggil Modul Lain atau Core API:

```javascript
const response = await this.api.call('system.getMetrics', { scope: 'cpu' });
console.log('Metrik CPU Host:', response);
```

---

## 🎯 Selanjutnya

Pelajari bagaimana cara membuat menu modul kamu otomatis muncul di Sidebar web panel pada [**05. Injeksi Menu ke WagonBox UI**](./05-ui-menu-injection.md).
