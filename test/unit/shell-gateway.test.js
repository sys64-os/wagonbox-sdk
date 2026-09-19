import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ShellGateway } from '../../lib/shell.js';
import { MockCoreBridge } from '../../lib/core-bridge.js';

describe('ShellGateway', () => {
  it('rejects without capability', async () => {
    const bridge = new MockCoreBridge([]);
    const gw = new ShellGateway(bridge, new Set());
    await assert.rejects(() => gw.execute('ls', []), /Capability required/);
  });
  it('anti-injection: rejects non-array args', async () => {
    const bridge = new MockCoreBridge(['shell.execute']);
    const gw = new ShellGateway(bridge, new Set(['shell.execute']));
    await assert.rejects(() => gw.execute('ls', 'bad'), /must be an array/);
  });
  it('executes via bridge', async () => {
    const bridge = new MockCoreBridge(['shell.execute']);
    bridge.onRequest('SHELL_EXECUTE', async (p) => ({ stdout: p.command, stderr: '', exitCode: 0 }));
    const gw = new ShellGateway(bridge, new Set(['shell.execute']));
    const res = await gw.execute('systemctl', ['status', 'nginx']);
    assert.equal(res.stdout, 'systemctl');
  });
  it('spawn returns handle', async () => {
    const bridge = new MockCoreBridge(['shell.execute']);
    bridge.onRequest('SHELL_SPAWN', async () => ({ requestId: 'r1', pid: 1234 }));
    const gw = new ShellGateway(bridge, new Set(['shell.execute']));
    const h = await gw.spawn('tail', ['-f', '/var/log/syslog']);
    assert.equal(h.pid, 1234);
  });
});
