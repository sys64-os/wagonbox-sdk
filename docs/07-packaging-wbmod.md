# 📦 07. Build & Packaging ke `.wbmod`

Format berkas **`.wbmod`** (*WagonBox Module*) adalah format arsip terenkripsi dan tertandatangani yang digunakan untuk mendistribusikan modul ekstensi ke server WagonBox.

---

## 🛠️ Langkah 1: Bundling Kode Sumber

Untuk menggabungkan seluruh file Javascript dan library pihak ketiga menjadi satu file bundle mandiri, gunakan bundler seperti **`esbuild`**:

Pasang `esbuild`:
```bash
npm install --save-dev esbuild
```

Jalankan perintah build:
```bash
npx esbuild src/index.js \
  --bundle \
  --platform=node \
  --format=esm \
  --external:@wagonbox/sdk \
  --outfile=dist/bundle.js
```

> 💡 **Tips:** Selalu tambahkan `--external:@wagonbox/sdk` karena SDK sudah disediakan langsung oleh runtime Core WagonBox di server.

---

## 🔒 Langkah 2: Kompilasi ke V8 Bytecode (Opsional / Recommended)

Untuk melindungi hak cipta dan kekayaan intelektual kode sumber modul dari pembajakan, kamu bisa mengompilasi `dist/bundle.js` menjadi V8 Bytecode (`.jsc`) menggunakan **`bytenode`**:

```bash
npm install --save-dev bytenode
npx bytenode --compile dist/bundle.js dist/bundle.jsc
```

Di `manifest.json`, arahkan `entryPoint` ke file `.jsc` tersebut:
```json
{
  "entryPoint": "dist/bundle.jsc"
}
```

---

## 📦 Langkah 3: Mengemas Menjadi File `.wbmod`

Struktur isi dari file `.wbmod` adalah arsip tar/gzip yang berisi:
1. `manifest.json` (wajib di root arsip)
2. `dist/bundle.js` atau `dist/bundle.jsc`
3. Folder `assets/` atau file pendukung lainnya (opsional)

Kamu bisa membuat skrip otomatisasi `build-wbmod.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> 1. Bundling..."
npx esbuild src/index.js --bundle --platform=node --format=esm --external:@wagonbox/sdk --outfile=dist/bundle.js

echo "==> 2. Mengompilasi Bytecode..."
npx bytenode --compile dist/bundle.js dist/bundle.jsc

echo "==> 3. Membuat paket .wbmod..."
tar -czf wagonbox-myplugin-1.0.0.wbmod manifest.json dist/

echo "✅ Berhasil! File modul siap dipasang: wagonbox-myplugin-1.0.0.wbmod"
```

---

## 🚀 Langkah 4: Cara Memasang Modul di Server WagonBox

Ada dua cara mudah untuk memasang modul di server:

### Cara A: Melalui Web Panel (GUI)
1. Buka Web Panel WagonBox di browser.
2. Masuk ke menu **APPS STORE → Installed Modules**.
3. Klik tombol **Upload .wbmod** dan pilih file modul kamu.
4. Klik tombol **Activate**. Menu baru akan langsung muncul di sidebar!

### Cara B: Melalui Terminal (CLI)
Salin file `.wbmod` ke direktori modul sistem di server:
```bash
sudo cp wagonbox-myplugin-1.0.0.wbmod /opt/wagonbox/packages/
sudo wagonbox module install /opt/wagonbox/packages/wagonbox-myplugin-1.0.0.wbmod
sudo wagonbox module activate wagonbox-myplugin
```

---

## 🎉 Selamat!
Kamu sekarang sudah menguasai seluruh alur pembuatan, pengujian, injeksi UI, hingga distribusi modul di ekosistem WagonBox. Selamat berkarya! 🚀
