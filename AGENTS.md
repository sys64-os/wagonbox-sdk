# AGENTS - WagonBox SDK

## Baca Urutan
1. **BRD.md** — Masalah bisnis & user stories
2. **PRD.md** — Spesifikasi fitur
3. **blueprint.md** — Norma teknis (wajib)
4. **system-architecture.md** — Desain ins arsitektur
5. **build-flow.md** — Alur build library L1 → `.jsc` → GPG sign
6. **scaffolding.md** — Template proyek baru
7. **pelaksana docs** — Implementasi modul `.wbmod`

## Tugas Agen
- Library L1: obfuscate→encode strings→`.jsc`→GPG sign (anti-awam)
- `.wbmod` modules: verify→decrypt→V8 Context (repo terpisah)
- Hosting publik: `wagonbox-deb`/`wagonbox-rpm`/`wagonbox-key` (tanpa token)
- Gunakan `enforce/blueprint-v1` branch untuk perubahan arsitektur

## Command Cepat
```bash
npm run lint && npm test
# build library L1: node scripts/obfuscate.mjs
# sign: GPG sign .jsc files
```