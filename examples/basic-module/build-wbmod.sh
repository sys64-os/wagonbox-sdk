#!/usr/bin/env bash
set -euo pipefail
# Reference build-wbmod.sh — sesuaikan MODULE_BUILD_SECRET & ECDSA key di CI
# Opsional: npm install --save-dev bytenode && npx bytenode --compile dist/bundle.js dist/bundle.jsc
esbuild src/index.js --bundle --platform=node --outfile=dist/bundle.js
# bytenode -> .jsc (opsional, recommended untuk production), lalu AES-256-GCM + ECDSA sign -> .wbmod
# Lihat scripts/build-wbmod.mjs & docs/07-packaging-wbmod.md
echo "bundle ready: dist/bundle.js"
