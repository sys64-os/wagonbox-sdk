export class HardwareGateway {
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') throw new Error('CoreBridge with request() method is required');
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() { if (!this.capabilities.has('system.read')) throw new Error('Capability required: system.read'); }
  async telemetry() { this.requireRead(); return this.coreBridge.request('HARDWARE_TELEMETRY', {}); }
  async fingerprint() { this.requireRead(); return this.coreBridge.request('HARDWARE_FINGERPRINT', {}); }
}
