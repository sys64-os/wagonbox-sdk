export class StorageMgmtGateway {
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') throw new Error('CoreBridge with request() method is required');
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() { if (!this.capabilities.has('storage.read')) throw new Error('Capability required: storage.read'); }
  requireConfigure() { if (!this.capabilities.has('storage.configure')) throw new Error('Capability required: storage.configure'); }
  async volumes() { this.requireRead(); return this.coreBridge.request('STORAGE_VOLUMES', {}); }
  async createVolume(input) { this.requireConfigure(); if (!input || typeof input !== 'object') throw new Error('createVolume input must be object'); return this.coreBridge.request('STORAGE_CREATE_VOLUME', { input }); }
  async deleteVolume(id) { this.requireConfigure(); if (!id) throw new Error('id required'); return this.coreBridge.request('STORAGE_DELETE_VOLUME', { id }); }
  async mount(id, path) { this.requireConfigure(); if (!id || !path) throw new Error('id and path required'); return this.coreBridge.request('STORAGE_MOUNT', { id, path }); }
  async unmount(id) { this.requireConfigure(); if (!id) throw new Error('id required'); return this.coreBridge.request('STORAGE_UNMOUNT', { id }); }
}
