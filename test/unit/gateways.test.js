import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockCoreBridge } from '../../lib/core-bridge.js';
import { NetworkGateway } from '../../lib/network.js';
import { LicenseGateway } from '../../lib/license.js';
import { validateManifest } from '../../lib/manifest.js';

describe('New gateways', () => {
  it('NetworkGateway requires capability', async () => {
    const b = new MockCoreBridge([]); const g = new NetworkGateway(b, new Set());
    await assert.rejects(() => g.interfaces(), /Capability required/);
  });
  it('LicenseGateway status via bridge', async () => {
    const b = new MockCoreBridge(['license.read']); b.onRequest('LICENSE_STATUS', async () => ({ tier:'pro' }));
    const g = new LicenseGateway(b, new Set(['license.read']));
    const r = await g.status(); assert.equal(r.tier,'pro');
  });
  it('validateManifest ok/invalid', () => {
    const ok = validateManifest({ name:'wagonbox-foo', version:'1.0.0', sdkApi:'wagonbox.plugin.v1', minCoreVersion:'1.0.0', entryPoint:'index.js', apiNamespace:'foo', requestedCapabilities:['shell.execute'] });
    assert.equal(ok.valid, true);
    const bad = validateManifest({ name:'bad', version:'x', sdkApi:'bad', minCoreVersion:'', entryPoint:'', apiNamespace:'', requestedCapabilities:['bad.cap'] });
    assert.equal(bad.valid, false);
  });
  it('verifyWbmod mock', async () => {
    const b = new MockCoreBridge([]);
    const r1 = await b.verifyWbmod(null); assert.equal(r1.ok, false);
    const r2 = await b.verifyWbmod({ v:1, manifestName:'wagonbox-foo', data:'a', iv:'b', tag:'c', signature:'sig' }); assert.equal(r2.ok, true);
  });
  it('subscribe returns unsubscribe', () => {
    const b = new MockCoreBridge([]); let n=0; const unsub=b.subscribe('ev', ()=>n++); b.emitEvent('ev',{}); assert.equal(n,1); unsub(); b.emitEvent('ev',{}); assert.equal(n,1);
  });
});
