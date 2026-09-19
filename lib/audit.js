export class AuditGateway {
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') throw new Error('CoreBridge with request() method is required');
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() { if (!this.capabilities.has('audit.read')) throw new Error('Capability required: audit.read'); }
  async record(entry) { this.requireRead(); if (!entry || typeof entry !== 'object') throw new Error('entry must be object'); return this.coreBridge.request('AUDIT_RECORD', { entry }); }
  async query(filter) { this.requireRead(); return this.coreBridge.request('AUDIT_QUERY', { filter: filter || {} }); }
}
