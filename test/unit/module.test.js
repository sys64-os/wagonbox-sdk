import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WagonboxModule } from '../../lib/module.js';
import { MockCoreBridge } from '../../lib/core-bridge.js';

describe('WagonboxModule', () => {
  it('lifecycle hooks callable', async () => {
    const bridge = new MockCoreBridge(['api.register']);
    class MyMod extends WagonboxModule {
      async onInit(){ this.inited=true; }
      async onStart(){ this.started=true; }
    }
    const m = new MyMod({ moduleId:'wagonbox-test', coreBridge: bridge, grantedCapabilities:['api.register'] });
    await m.onInit();
    await m.onStart();
    assert.equal(m.inited, true);
    assert.equal(m.started, true);
  });
  it('hasCapability / requireCapability', () => {
    const bridge = new MockCoreBridge(['shell.execute']);
    const m = new WagonboxModule({ moduleId:'wagonbox-test', coreBridge: bridge, grantedCapabilities:['shell.execute'] });
    assert.equal(m.hasCapability('shell.execute'), true);
    assert.throws(() => m.requireCapability('config.write'), /Capability required/);
  });
});
