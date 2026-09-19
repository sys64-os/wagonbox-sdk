export class TerminalGateway {
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') throw new Error('CoreBridge with request() method is required');
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  require() { if (!this.capabilities.has('terminal.execute')) throw new Error('Capability required: terminal.execute'); }
  async spawn(cols, rows) { this.require(); return this.coreBridge.request('TERMINAL_SPAWN', { cols, rows }); }
  async resize(handleId, cols, rows) { this.require(); if (!handleId) throw new Error('handleId required'); return this.coreBridge.request('TERMINAL_RESIZE', { handleId, cols, rows }); }
  async write(handleId, data) { this.require(); if (!handleId) throw new Error('handleId required'); return this.coreBridge.request('TERMINAL_WRITE', { handleId, data }); }
  async close(handleId) { this.require(); if (!handleId) throw new Error('handleId required'); return this.coreBridge.request('TERMINAL_CLOSE', { handleId }); }
}
