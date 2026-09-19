import { MockCoreBridge } from '../../lib/core-bridge.js';

export function createMockBridge(caps = ['shell.execute','config.read','config.write','api.register','api.call','storage.read','storage.write','storage.list','storage.remove']) {
  return new MockCoreBridge(caps);
}
export { MockCoreBridge };
