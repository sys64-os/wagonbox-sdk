export class LicenseGateway {
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') throw new Error('CoreBridge with request() method is required');
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() { if (!this.capabilities.has('license.read')) throw new Error('Capability required: license.read'); }
  requireActivate() { if (!this.capabilities.has('license.activate')) throw new Error('Capability required: license.activate'); }
  async status() { this.requireRead(); return this.coreBridge.request('LICENSE_STATUS', {}); }
  async activate(serialNumber, owner) {
    this.requireActivate();
    if (!serialNumber || typeof serialNumber !== 'string') throw new Error('serialNumber required');
    return this.coreBridge.request('LICENSE_ACTIVATE', { serialNumber, owner });
  }
  async importBundle(bundle) { this.requireActivate(); if (!bundle) throw new Error('bundle required'); return this.coreBridge.request('LICENSE_IMPORT', { bundle }); }
  async renew() { this.requireActivate(); return this.coreBridge.request('LICENSE_RENEW', {}); }
  async rebind(oldActivationId, newHwid) { this.requireActivate(); if (!oldActivationId) throw new Error('oldActivationId required'); return this.coreBridge.request('LICENSE_REBIND', { oldActivationId, newHwid }); }
}
