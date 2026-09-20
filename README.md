# @wagonbox/sdk

**Public Development SDK for WagonBox Extensions and UI Modules**

*Status: **Belum terdaftar di npm registry**. Instalasi langsung dari GitHub (pre-built `dist/` tersedia).*

---

## 📚 Dokumentasi Lengkap

Panduan langkah demi langkah yang ramah dan mudah dipahami:

1. [**01. Memulai (Getting Started)**](./docs/01-getting-started.md) — Panduan setup dan modul pertama.
2. [**02. Daur Hidup Modul (Lifecycle)**](./docs/02-module-lifecycle.md) — Penjelasan hook `onInit`, `onStart`, `onStop`, dan `onReload`.
3. [**03. Sistem Kapabilitas & Keamanan**](./docs/03-capabilities-security.md) — Model izin, sandbox, dan proteksi anti-injeksi.
4. [**04. Referensi Lengkap Gateway**](./docs/04-gateways-reference.md) — Shell, Storage, Config, dan API Gateway.
5. [**05. Injeksi Menu ke WagonBox UI**](./docs/05-ui-menu-injection.md) — Panduan memunculkan menu di sidebar web panel secara dinamis.
6. [**06. Unit Testing dengan MockCoreBridge**](./docs/06-testing-with-mock.md) — Ngetes modul secara otomatis tanpa menyalakan server Core.
7. [**07. Build & Packaging ke `.wbmod`**](./docs/07-packaging-wbmod.md) — Kompilasi bytecode dan pembuatan file `.wbmod`.

---

## 📦 Instalasi

**Pre-built `dist/` sudah tersedia di repo** — tidak perlu build step:

```bash
npm install git+https://github.com/sys64-os/wagonbox-sdk.git
```

Atau menggunakan shortcut di `package.json`:

```json
"dependencies": {
  "@wagonbox/sdk": "git+https://github.com/sys64-os/wagonbox-sdk.git"
}
```

> **Catatan:** `peerDependencies` → `zod` harus diinstall manual di project Anda:
> ```bash
> npm install zod
> ```

## 🛠️ Quick Start

```typescript
import { WagonboxModule } from '@wagonbox/sdk'

export default class MyModul extends WagonboxModule {
  async onStart() {
    await this.registerRoute('GET', '/hello', 'sayHello')
  }

  async sayHello() {
    const res = await this.shell.execute('echo', ['Halo WagonBox!'])
    return { message: res.stdout.trim() }
  }
}
```

Contoh modul `.wbmod` lengkap lihat `examples/basic-module/`.

## 🔧 Fitur Utama

- **ShellGateway**: `execute()` + `spawn()` (stream), Anti-Injeksi Shell (wajib `args: string[]`).
- **StorageGateway**: Workspace isolasi `/opt/wagonbox/data/<id>/`, proteksi path traversal (`../` diblokir).
- **ConfigGateway**: `get/set/all/delete` via database terenkripsi (SQLCipher).
- **ApiClient**: `registerRoute` & `call` (protokol `wagonbox.plugin.v1`).
- **WagonboxModule**: Base class dengan lifecycle `onInit/onStart/onStop/onReload`.
- **MockCoreBridge**: Emulator lingkungan Core untuk unit testing mandiri.

## 📄 Lisensi

**MIT License** — lihat file `LICENSE` untuk detailnya.
