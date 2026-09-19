#!/usr/bin/env bash
set -euo pipefail
# Reference build-wbmod.sh — sesuaikan MODULE_BUILD_SECRET & ECDSA key di CI
esbuild src/index.js --bundle --platform=node --outfile=dist/bundle.js
# bytenode -> .jsc, lalu AES-256-GCM + ECDSA sign -> .wbmod (lihat docs/build-flow.md)
echo "bundle ready: dist/bundle.js"
