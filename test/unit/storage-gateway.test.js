import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StorageGateway } from '../../lib/storage.js';
import { MockCoreBridge } from '../../lib/core-bridge.js';

describe('StorageGateway', () => {
  it('blocks path traversal', async () => {
    const bridge = new MockCoreBridge(['storage.read']);
    const gw = new StorageGateway(bridge, 'wagonbox-test', new Set(['storage.read']));
    await assert.rejects(() => gw.read('../etc/passwd'), /traversal/);
    await assert.rejects(() => gw.read('a/../../b'), /traversal/);
  });
  it('requires capability', async () => {
    const bridge = new MockCoreBridge([]);
    const gw = new StorageGateway(bridge, 'wagonbox-test', new Set());
    await assert.rejects(() => gw.read('file.txt'), /Capability required/);
  });
  it('getWorkspacePath isolated', () => {
    const bridge = new MockCoreBridge(['storage.read']);
    const gw = new StorageGateway(bridge, 'my-mod', new Set(['storage.read']));
    assert.equal(gw.getWorkspacePath(), '/opt/wagonbox/data/my-mod');
  });
});
