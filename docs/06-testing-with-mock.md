# 🧪 06. Unit Testing dengan MockCoreBridge

Saat mengembangkan modul, kamu tidak perlu menyalakan daemon WagonBox Core secara utuh hanya untuk menguji apakah kodemu berjalan dengan benar.

SDK menyediakan kelas **`MockCoreBridge`** yang menyimulasikan seluruh lingkungan Core WagonBox, termasuk sistem kapabilitas, penyimpanan in-memory, dan eksekusi shell.

---

## ⚡ Mengapa Menggunakan `MockCoreBridge`?

1. **Cepat & Ringan**: Menjalankan pengujian dalam hitungan milidetik.
2. **Isolasi Penuh**: Menguji skenario izin ditolak (*capability denied*) dengan mudah.
3. **Ramah CI/CD**: Bisa langsung dijalankan di GitHub Actions via `npm test`.

---

## 📝 Contoh Pembuatan Unit Test

Contoh kita memiliki modul di `src/index.js`:

```javascript
// src/index.js
import { WagonboxModule } from '@wagonbox/sdk';

export default class SystemInfoModule extends WagonboxModule {
  async getHostname() {
    this.requireCapability('shell.execute');
    const out = await this.shell.execute('hostname', []);
    return { hostname: out.stdout.trim() };
  }

  async saveApiKey(key) {
    this.requireCapability('config.write');
    await this.config.set('api_key', key);
    return { success: true };
  }
}
```

Sekarang kita buat file test `test/module.test.js` menggunakan test runner bawaan Node.js (`node:test`):

```javascript
// test/module.test.js
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockCoreBridge } from '@wagonbox/sdk';
import SystemInfoModule from '../src/index.js';

describe('SystemInfoModule Test Suite', () => {
  let bridge;
  let module;

  beforeEach(() => {
    // Siapkan Mock Bridge dengan izin yang ditentukan
    bridge = new MockCoreBridge({
      grantedCapabilities: ['shell.execute', 'config.read', 'config.write', 'storage.write']
    });

    // Inisialisasi modul dengan ID dan mock bridge
    module = new SystemInfoModule('wagonbox-sysinfo', bridge);
  });

  it('bisa membaca hostname saat izin shell.execute diberikan', async () => {
    await module.onInit();
    const res = await module.getHostname();
    
    assert.ok(res.hostname);
    assert.strictEqual(typeof res.hostname, 'string');
  });

  it('menyimpan dan membaca kembali API key via config gateway', async () => {
    await module.onInit();
    await module.saveApiKey('secret-key-999');

    const saved = await module.config.get('api_key');
    assert.strictEqual(saved, 'secret-key-999');
  });

  it('gagal dan melempar error jika izin tidak diberikan', async () => {
    // Bikin bridge tanpa izin shell.execute
    const unprivilegedBridge = new MockCoreBridge({
      grantedCapabilities: ['config.read']
    });
    const unprivilegedModule = new SystemInfoModule('wagonbox-sysinfo', unprivilegedBridge);

    await assert.rejects(
      async () => {
        await unprivilegedModule.getHostname();
      },
      /CAPABILITY_DENIED/
    );
  });
});
```

---

## 🏃 Menjalankan Test

Tambahkan skrip ke `package.json`:

```json
"scripts": {
  "test": "node --test test/**/*.test.js"
}
```

Lalu jalankan di terminal:

```bash
npm test
```

---

## 🎯 Selanjutnya

Setelah modul selesai dibuat dan diuji, pelajari cara memaketkannya menjadi file distribusi `.wbmod` di [**07. Build & Packaging ke `.wbmod`**](./07-packaging-wbmod.md).
