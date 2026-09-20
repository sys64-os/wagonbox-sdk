# 🧪 06. Unit Testing dengan MockCoreBridge

`MockCoreBridge` menyimulasikan Core WagonBox: kapabilitas, storage in-memory, shell, dan **semua gateway baru**.

---

## ⚡ Quick Example

```javascript
// test/module.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MockCoreBridge, createModule } from '@wagonbox/sdk';
import MyModule from '../src/index.js';

describe('MyModule', () => {
  it('uses new gateways', async () => {
    const bridge = new MockCoreBridge({
      grantedCapabilities: ['network.read', 'license.read', 'terminal.execute', 'audit.read']
    });
    
    const context = {
      moduleId: 'wagonbox-test',
      moduleVersion: '1.0.0',
      coreVersion: '1.0.0',
      sdkVersion: '1.0.0',
      grantedCapabilities: ['network.read', 'license.read', 'terminal.execute', 'audit.read'],
      coreBridge: bridge
    };
    
    const mod = createModule(context);
    mod.module = new MyModule(); // custom module logic
    await mod.onInit();
    const ifaces = await mod.network.interfaces();
    assert.ok(Array.isArray(ifaces));
    const lic = await mod.license.status();
    assert.ok(lic);
  });

  it('verifyWbmod format check', async () => {
    const bridge = new MockCoreBridge([]);
    const ok = await bridge.verifyWbmod({ v:1, manifestName:'foo', data:'x', iv:'y', tag:'z', signature:'sig' });
    assert.equal(ok.ok, true);
    const bad = await bridge.verifyWbmod(null);
    assert.equal(bad.ok, false);
  });

  it('subscribe returns unsubscribe', () => {
    const bridge = new MockCoreBridge([]);
    let n = 0;
    const unsub = bridge.subscribe('ev', () => n++);
    bridge.emitEvent('ev', {});
    assert.equal(n, 1);
    unsub(); bridge.emitEvent('ev', {}); assert.equal(n, 1);
  });
});
```

---

## 🎯 Menjalankan Test

```bash
npm test
```

---

## 🎯 Selanjutnya

Pelajari packaging `.wbmod` di [**07. Build & Packaging**](./07-packaging-wbmod.md).
