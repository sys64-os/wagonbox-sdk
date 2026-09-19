# 📖 Panduan Lengkap WagonBox SDK

Selamat datang di dokumentasi resmi **WagonBox SDK (`@wagonbox/sdk`)**! 🚀

SDK ini dirancang supaya kamu bisa bikin modul/ekstensi kustom untuk ekosistem WagonBox dengan mudah, cepat, dan aman. Semua modul yang kamu buat nantinya bisa dipaketkan jadi file `.wbmod` dan langsung dipasang di server WagonBox mana saja.

---

## 🧭 Daftar Isi Dokumentasi

1. [**01. Memulai (Getting Started)**](./01-getting-started.md)
   - Konsep dasar modul WagonBox.
   - Cara instalasi SDK dan struktur folder standar.
   - Bikin modul pertama (*Hello World*).

2. [**02. Daur Hidup Modul (Lifecycle)**](./02-module-lifecycle.md)
   - Tahapan eksekusi: `onInit()`, `onStart()`, `onStop()`, dan `onReload()`.
   - Kapan harus registrasi route dan kapan harus bersih-bersih resource.

3. [**03. Sistem Kapabilitas & Keamanan (Security & Sandbox)**](./03-capabilities-security.md)
   - Kenapa modul berjalan di dalam sandbox?
   - Daftar permission / capabilities yang tersedia.
   - Cara kerja isolasi workspace dan proteksi dari akses ilegal.

4. [**04. Referensi Lengkap Gateway**](./04-gateways-reference.md)
   - **Shell Gateway**: Menjalankan perintah Linux tanpa takut *command injection*.
   - **Storage Gateway**: Baca/tulis file di folder khusus modulmu tanpa takut *path traversal*.
   - **Config Gateway**: Simpan settingan/konfigurasi secara terenkripsi.
   - **API Client**: Mendaftarkan endpoint REST API ke Core WagonBox.

5. [**05. Injeksi Menu ke WagonBox UI**](./05-ui-menu-injection.md)
   - Cara otomatis memunculkan menu di Sidebar `wagonbox-ui`.
   - Pengaturan hierarki menu (sub-menu) dan custom icon.
   - Bikin halaman dinamis modul tanpa perlu build ulang frontend.

6. [**06. Unit Testing dengan MockCoreBridge**](./06-testing-with-mock.md)
   - Cara ngetes modul tanpa harus menyalakan server Core WagonBox.
   - Simulasi izin (*granted capabilities*), trigger event, dan cek respons gateway.

7. [**07. Build & Packaging ke `.wbmod`**](./07-packaging-wbmod.md)
   - Dari source code Javascript/Typescript jadi bundle file.
   - Kompilasi ke V8 Bytecode (`.jsc`) untuk proteksi kode.
   - Cara bungkus jadi file `.wbmod` siap install.

---

## ⚡ Quick Snippet

```javascript
import { WagonboxModule } from '@wagonbox/sdk';

export default class MyModule extends WagonboxModule {
  async onStart() {
    // Daftarin route GET /api/v1/ext/mytools/ping
    await this.registerRoute('GET', '/ping', 'handlePing');
  }

  async handlePing() {
    return { ok: true, message: 'Pong dari modul WagonBox!' };
  }
}
```
