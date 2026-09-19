#!/usr/bin/env node
// Canonical .wbmod build: manifest + assets -> AES-256-GCM -> ECDSA P-256 sign -> .wbmod
// Dev keys only; production keys in CI signing env per build-flow.md
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createCipheriv, createSign, randomBytes } from 'node:crypto';
import { join } from 'node:path';

const manifestPath = process.argv[2] || 'manifest.json';
const outPath = process.argv[3] || 'dist/module.wbmod';
if (!existsSync(manifestPath)) { console.error(`manifest not found: ${manifestPath}`); process.exit(1); }
const manifest = JSON.parse(readFileSync(manifestPath,'utf8'));
const payload = JSON.stringify({ manifest, assets: {}, builtAt: new Date().toISOString() });
const key = process.env.WBMOD_AES_KEY ? Buffer.from(process.env.WBMOD_AES_KEY,'hex') : randomBytes(32);
const iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const enc = Buffer.concat([cipher.update(payload,'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
let signature = '';
if (process.env.WBMOD_ECDSA_PRIV) {
  const sign = createSign('SHA256');
  sign.update(Buffer.concat([iv, tag, enc]));
  signature = sign.sign(process.env.WBMOD_ECDSA_PRIV, 'base64');
} else {
  console.warn('WBMOD_ECDSA_PRIV not set — unsigned dev build');
}
const wbmod = { v: 1, iv: iv.toString('base64'), tag: tag.toString('base64'), data: enc.toString('base64'), signature, manifestName: manifest.name };
import { mkdirSync } from 'node:fs';
mkdirSync(join(outPath,'..'), { recursive: true });
writeFileSync(outPath, JSON.stringify(wbmod));
console.log(`.wbmod built: ${outPath} (${wbmod.manifestName})`);
