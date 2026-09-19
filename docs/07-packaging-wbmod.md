# 📦 07. Build & Packaging ke `.wbmod`

Format `.wbmod` = arsip terenkripsi (AES-256-GCM) + tertandatangani (ECDSA P-256).

---

## 🛠️ 1. Bundling (`esbuild`)

```bash
npm install --save-dev esbuild
npx esbuild src/index.js --bundle --platform=node --format=esm --external:@wagonbox/sdk --outfile=dist/bundle.js
```

---

## 🔒 2. V8 Bytecode (opsional, recommended)

```bash
npm install --save-dev bytenode
npx bytenode --compile dist/bundle.js dist/bundle.jsc
# manifest.json: "entryPoint": "dist/bundle.jsc"
```

---

## 🔐 3. Crypto Build (Canonical: `scripts/build-wbmod.mjs`)

```bash
# Dev keys (set env atau gunakan .env)
export WBMOD_AES_KEY=$(openssl rand -hex 32)
export WBMOD_ECDSA_PRIV=$(cat ecdsa-private.pem)

# Build
node scripts/build-wbmod.mjs manifest.json dist/module.wbmod
```

Pipeline otomatis:
1. Read `manifest.json`
2. Payload = JSON stringify `{manifest, assets, builtAt}`
3. **AES-256-GCM** encrypt (random IV + auth tag)
4. **ECDSA P-256** sign (iv+tag+ciphertext)
5. Output `.wbmod` JSON: `{v, iv, tag, data, signature, manifestName}`

---

## 🛠️ Skrip Otomatisasi

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "==> Bundling..."
npx esbuild src/index.js --bundle --platform=node --format=esm --external:@wagonbox/sdk --outfile=dist/bundle.js
echo "==> Bytecode..."
npx bytenode --compile dist/bundle.js dist/bundle.jsc
echo "==> Crypto .wbmod..."
node scripts/build-wbmod.mjs manifest.json dist/myplugin.wbmod
echo "✅ Siap: dist/myplugin.wbmod"
```

---

## 🚀 4. Pasang di Server

**GUI:** Apps Store → Upload `.wbmod` → Activate

**CLI:**
```bash
sudo cp myplugin.wbmod /opt/wagonbox/packages/
sudo wagonbox module install /opt/wagonbox/packages/myplugin.wbmod
sudo wagonbox module activate myplugin
```

---

## 🧪 Verifikasi (Dev)

```javascript
const bridge = new MockCoreBridge([]);
const wbmod = JSON.parse(fs.readFileSync('dist/myplugin.wbmod'));
await bridge.verifyWbmod(wbmod); // {ok:true, step:'decrypt'}
```

---

## 🎉 Selesai!
Modul siap didistribusikan via `.wbmod` (AES-256-GCM + ECDSA P-256).
