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
    "api.register",
    "network.read",
    "system.read"
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

```javascript
import { WagonboxModule } from '@wagonbox/sdk';

export default class ModulKeren extends WagonboxModule {
  async onInit() { console.log(`[${this.moduleId}] load`); }
  async onStart() {
    await this.registerRoute('GET', '/info', 'getInfo');
    await this.registerRoute('GET', '/network', 'getNetwork');
    await this.registerRoute('GET', '/license', 'getLicense');
  }
  async getInfo() {
    const h = await this.shell.execute('uname', ['-a']);
    await this.storage.write('last_run.txt', new Date().toISOString());
    return { status: 'online', system: h.stdout.trim() };
  }
  async getNetwork() { return this.network.interfaces(); }
  async getLicense() { return this.license.status(); }
  async onStop() { console.log(`[${this.moduleId}] stop`); }
}
```

### Contoh Pakai Gateway Baru

```javascript
// Network
const ifaces = await this.network.interfaces();
await this.network.configure({ id: 'wan0', ipv4: 'dhcp' });

// Hardware
const tel = await this.hardware.telemetry();
const fp = await this.hardware.fingerprint();

// License
const st = await this.license.status();
await this.license.activate('WB-PRO-XXXX', { email: 'ops@example.com' });

// Terminal PTY
const h = await this.terminal.spawn(80, 24);
await this.terminal.write(h.handleId, 'ls\n');
```

---

## 🎯 Selanjutnya

Pelajari siklus hidup modul di [**02. Daur Hidup Modul (Lifecycle)**](./02-module-lifecycle.md).
