export class NetworkGateway {
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') throw new Error('CoreBridge with request() method is required');
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() { if (!this.capabilities.has('network.read')) throw new Error('Capability required: network.read'); }
  requireConfigure() { if (!this.capabilities.has('network.configure')) throw new Error('Capability required: network.configure'); }
  async interfaces() { this.requireRead(); return this.coreBridge.request('NETWORK_LIST', {}); }
  async connections() { this.requireRead(); return this.coreBridge.request('NETWORK_CONNECTIONS', {}); }
  async get(id) {
    this.requireRead();
    if (!id || typeof id !== 'string') throw new Error('Connection id must be non-empty string');
    return this.coreBridge.request('NETWORK_GET', { id });
  }
  async configure(input) {
    this.requireConfigure();
    if (!input || typeof input !== 'object') throw new Error('Network configure input must be object');
    return this.coreBridge.request('NETWORK_CONFIGURE', { input });
  }
  async up(id) { this.requireConfigure(); if (!id) throw new Error('id required'); return this.coreBridge.request('NETWORK_UP', { id }); }
  async down(id) { this.requireConfigure(); if (!id) throw new Error('id required'); return this.coreBridge.request('NETWORK_DOWN', { id }); }
}
