export class FilesGateway {
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') throw new Error('CoreBridge with request() method is required');
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() { if (!this.capabilities.has('file.read')) throw new Error('Capability required: file.read'); }
  requireWrite() { if (!this.capabilities.has('file.write')) throw new Error('Capability required: file.write'); }
  async read(path) { this.requireRead(); if (!path || typeof path !== 'string') throw new Error('path required'); return this.coreBridge.request('FILES_READ', { path }); }
  async write(path, data) { this.requireWrite(); if (!path) throw new Error('path required'); return this.coreBridge.request('FILES_WRITE', { path, data }); }
  async list(path) { this.requireRead(); return this.coreBridge.request('FILES_LIST', { path: path || '/' }); }
  async stat(path) { this.requireRead(); if (!path) throw new Error('path required'); return this.coreBridge.request('FILES_STAT', { path }); }
  async remove(path) { this.requireWrite(); if (!path) throw new Error('path required'); return this.coreBridge.request('FILES_REMOVE', { path }); }
  async mkdir(path) { this.requireWrite(); if (!path) throw new Error('path required'); return this.coreBridge.request('FILES_MKDIR', { path }); }
}
