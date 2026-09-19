# 🚀 01. Memulai (Getting Started)

Di bab ini, kita bakal belajar cara setup proyek modul baru dari nol, instalasi SDK, dan bikin modul pertama kamu.

---

## 📦 Apa itu Modul WagonBox?

Modul WagonBox adalah plugin mandiri yang bisa memperluas fungsi panel kontrol WagonBox. Contohnya:
- Bikin manajer Docker container.
- Bikin alat backup otomatis ke Google Drive / S3.
- Bikin dashboard monitoring performa kustom.

Semua modul berjalan di dalam **VM Sandbox** yang aman dan berkomunikasi dengan Core WagonBox lewat protokol standar `wagonbox.plugin.v1`.

---

## 🛠️ Instalasi SDK

Bikin folder proyek baru dan inisialisasi npm:

```bash
mkdir wagonbox-modul-keren
cd wagonbox-modul-keren
npm init -y
```

Pasang `@wagonbox/sdk`:

```bash
npm install @wagonbox/sdk
```

---

## 📁 Struktur Standar Proyek Modul

Struktur folder yang direkomendasikan seperti ini:

```text
wagonbox-modul-keren/
├── manifest.json        # Identitas, izin kapabilitas, & menu UI modul
├── package.json         # Dependensi proyek
├── src/
│   └── index.js         # Entrypoint utama (class turunan WagonboxModule)
├── test/
│   └── index.test.js    # Unit test modul
└── dist/
    └── bundle.js        # Hasil bundling siap packaging
```

---

## 📝 1. Bikin `manifest.json`

File `manifest.json` adalah paspor untuk modul kamu. Core WagonBox akan membaca file ini untuk tahu siapa nama modulmu, apa saja izin yang diminta, dan apakah modul ini punya menu di UI.

Buat file `manifest.json`:

```json
{
  "name": "wagonbox-modul-keren",
  "version": "1.0.0",
  "sdkApi": "wagonbox.plugin.v1",
  "minCoreVersion": "1.0.0",
  "license": "MIT",
  "entryPoint": "src/index.js",
  "requestedCapabilities": [
    "shell.execute",
    "storage.read",
    "storage.write",
    "api.register"
  ],
  "apiNamespace": "keren",
  "methods": [
    "keren.getInfo"
  ],
  "ui": {
    "nav": [
      {
        "label": "Modul Keren",
        "path": "/modules/keren",
        "icon": "cilApplications",
        "order": 10
      }
    ]
  }
}
```

> 💡 **Penjelasan Singkat:**
> - `name`: Harus berawalan `wagonbox-` dengan huruf kecil dan tanda strip.
> - `requestedCapabilities`: Daftar izin yang dibutuhkan modul (lihat [Bab 03](./03-capabilities-security.md)).
> - `apiNamespace`: Prefix unik untuk endpoint API modul (`/api/v1/ext/<apiNamespace>/...`).
> - `ui.nav`: Konfigurasi tombol menu yang otomatis muncul di Sidebar WagonBox UI.

---

## 💻 2. Bikin Kode Utama (`src/index.js`)

Bikin file `src/index.js` dan buat class yang meng-extend `WagonboxModule`:

```javascript
import { WagonboxModule } from '@wagonbox/sdk';

export default class ModulKeren extends WagonboxModule {
  // Dipanggil pertama kali saat modul di-load
  async onInit() {
    console.log(`[${this.moduleId}] Modul berhasil diinisialisasi!`);
  }

  // Dipanggil saat modul diaktifkan di panel
  async onStart() {
    // Daftarkan endpoint REST API: GET /api/v1/ext/keren/info
    await this.registerRoute('GET', '/info', 'getInfo');
  }

  // Handler fungsi untuk endpoint /info
  async getInfo() {
    // Eksekusi perintah Linux dengan aman
    const hostInfo = await this.shell.execute('uname', ['-a']);
    
    // Tulis catatan log ke storage modul
    await this.storage.write('last_run.txt', new Date().toISOString());

    return {
      status: 'online',
      message: 'Halo dari Modul Keren!',
      system: hostInfo.stdout.trim()
    };
  }

  // Dipanggil saat modul dinonaktifkan
  async onStop() {
    console.log(`[${this.moduleId}] Modul dinonaktifkan.`);
  }
}
```

---

## 🎯 Selanjutnya

Setelah paham cara bikin modul dasar, yuk pelajari lebih detail tentang siklus hidup modul di [**02. Daur Hidup Modul (Lifecycle)**](./02-module-lifecycle.md).
