import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigGateway } from '../../lib/config.js';
import { MockCoreBridge } from '../../lib/core-bridge.js';

describe('ConfigGateway', () => {
  it('get requires read capability', async () => {
    const bridge = new MockCoreBridge([]);
    const gw = new ConfigGateway(bridge, new Set());
    await assert.rejects(() => gw.get('foo'), /Capability required/);
  });
  it('set requires write capability', async () => {
    const bridge = new MockCoreBridge(['config.read']);
    const gw = new ConfigGateway(bridge, new Set(['config.read']));
    await assert.rejects(() => gw.set('k','v'), /Capability required/);
  });
  it('get/set roundtrip via mock', async () => {
    const bridge = new MockCoreBridge(['config.read','config.write']);
    const gw = new ConfigGateway(bridge, new Set(['config.read','config.write']));
    await gw.set('hello','world');
    const v = await gw.get('hello');
    assert.equal(v, 'world');
  });
});
