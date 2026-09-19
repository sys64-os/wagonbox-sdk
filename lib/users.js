export class UsersGateway {
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') throw new Error('CoreBridge with request() method is required');
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() { if (!this.capabilities.has('user.read')) throw new Error('Capability required: user.read'); }
  requireManage() { if (!this.capabilities.has('user.manage')) throw new Error('Capability required: user.manage'); }
  async list() { this.requireRead(); return this.coreBridge.request('USERS_LIST', {}); }
  async get(id) { this.requireRead(); if (!id) throw new Error('id required'); return this.coreBridge.request('USERS_GET', { id }); }
  async create(input) { this.requireManage(); if (!input || typeof input !== 'object') throw new Error('input must be object'); return this.coreBridge.request('USERS_CREATE', { input }); }
  async update(id, input) { this.requireManage(); if (!id) throw new Error('id required'); return this.coreBridge.request('USERS_UPDATE', { id, input }); }
  async delete(id) { this.requireManage(); if (!id) throw new Error('id required'); return this.coreBridge.request('USERS_DELETE', { id }); }
  async sshKeys(id) { this.requireRead(); if (!id) throw new Error('id required'); return this.coreBridge.request('USERS_SSH_KEYS', { id }); }
  async addSshKey(id, key) { this.requireManage(); if (!id || !key) throw new Error('id and key required'); return this.coreBridge.request('USERS_ADD_SSH_KEY', { id, key }); }
}
