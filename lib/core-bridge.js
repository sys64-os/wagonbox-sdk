import { EventEmitter } from 'node:events';
import { CORE_CAPABILITIES } from './constants.js';

/**
 * @typedef {typeof CORE_CAPABILITIES[number]} CoreCapability
 */

/**
 * @typedef {object} ModuleContext
 * @property {string} moduleId
 * @property {CoreBridge} coreBridge
 * @property {CoreCapability[]} grantedCapabilities
 * @property {Record<string, string>} config
 */

/**
 * Core Bridge interface for module-core communication.
 * @interface
 */
export class CoreBridgeBase extends EventEmitter {
  constructor() {
    super();
    /** @type {boolean} */
    this.connected = false;
    /** @type {Set<CoreCapability>} */
    this.grantedCapabilities = new Set();
  }

  /**
   * @template T
   * @param {string} event
   * @param {object} payload
   * @returns {Promise<T>}
   */
  async request(event, payload) {
    throw new Error('request() must be implemented by subclass');
  }

  /**
   * @param {string} event
   * @param {Function} listener
   * @returns {this}
   */
  on(event, listener) {
    return super.on(event, listener);
  }

  /**
   * @param {string} event
   * @param {Function} listener
   * @returns {this}
   */
  off(event, listener) {
    return super.off(event, listener);
  }

  /**
   * Emit an event to all listeners (uses EventEmitter.emit).
   * @param {string} event
   * @param {unknown} data
   * @returns {boolean} - true if event had listeners
   */
  emitEvent(event, data) {
    return super.emit(event, data);
  }

  /**
   * Subscribe to event - returns unsubscribe function.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} unsubscribe
   */
  subscribe(event, handler) {
    this.on(event, handler);
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe helper alias.
   * @param {string} event
   * @param {Function} handler
   */
  unsubscribe(event, handler) {
    this.off(event, handler);
  }

  /**
   * @returns {Promise<void>}
   */
  async connect() {
    this.connected = true;
  }

  /**
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.connected = false;
  }

  /**
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * @returns {ReadonlySet<CoreCapability>}
   */
  getGrantedCapabilities() {
    return new Set(this.grantedCapabilities);
  }

  /**
   * @param {CoreCapability[]} capabilities
   */
  setGrantedCapabilities(capabilities) {
    this.grantedCapabilities = new Set(capabilities);
  }
}

/**
 * Mock Core Bridge for testing.
 */
export class MockCoreBridge extends CoreBridgeBase {
  /**
   * @param {CoreCapability[]} grantedCapabilities
   */
  constructor(grantedCapabilities = []) {
    super();
    this.setGrantedCapabilities(grantedCapabilities);
    /** @type {Map<string, Function>} */
    this.handlers = new Map();
    /** @type {Map<string, Set<Function>>} */
    this.eventHandlers = new Map();
    /** @type {Record<string, string>} */
    this.config = {};
    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    this.onRequest('SHELL_EXECUTE', async (payload) => {
      return { stdout: '', stderr: '', exitCode: 0 };
    });

    this.onRequest('CONFIG_GET', async (payload) => {
      return this.config[payload.key] ?? null;
    });

    this.onRequest('CONFIG_SET', async (payload) => {
      this.config[payload.key] = payload.value;
      return { ok: true };
    });

    this.onRequest('CONFIG_GET_ALL', async () => {
      return { ...this.config };
    });

    this.onRequest('API_CALL', async (payload) => {
      return { status: 'ok', data: payload.data };
    });

    this.onRequest('API_REGISTER', async (payload) => {
      return { ok: true, route: payload.route };
    });

    this.onRequest('STORAGE_READ', async (payload) => {
      return { data: '' };
    });

    this.onRequest('STORAGE_WRITE', async (payload) => {
      return { ok: true };
    });

    this.onRequest('STORAGE_LIST', async (payload) => {
      return { entries: [] };
    });

    this.onRequest('STORAGE_EXISTS', async (payload) => {
      return { exists: false };
    });

    this.onRequest('STORAGE_REMOVE', async (payload) => {
      return { ok: true };
    });

    this.onRequest('MODULE_CALL', async (payload) => {
      return { ok: true, targetModule: payload.targetModule, method: payload.method, params: payload.params };
    });

    // new gateways default handlers
    const ok = async () => ({ ok: true });
    for (const ev of ['NETWORK_LIST','NETWORK_CONNECTIONS','NETWORK_GET','NETWORK_CONFIGURE','NETWORK_UP','NETWORK_DOWN','HARDWARE_TELEMETRY','HARDWARE_FINGERPRINT','STORAGE_VOLUMES','STORAGE_CREATE_VOLUME','STORAGE_DELETE_VOLUME','STORAGE_MOUNT','STORAGE_UNMOUNT','LICENSE_STATUS','LICENSE_ACTIVATE','LICENSE_IMPORT','LICENSE_RENEW','LICENSE_REBIND','USERS_LIST','USERS_GET','USERS_CREATE','USERS_UPDATE','USERS_DELETE','USERS_SSH_KEYS','USERS_ADD_SSH_KEY','TERMINAL_SPAWN','TERMINAL_RESIZE','TERMINAL_WRITE','TERMINAL_CLOSE','FILES_READ','FILES_WRITE','FILES_LIST','FILES_STAT','FILES_REMOVE','FILES_MKDIR','AUDIT_RECORD','AUDIT_QUERY']) {
      if (!this.handlers.has(ev)) this.onRequest(ev, ok);
    }
  }

  /**
   * Simulate .wbmod verification pipeline for testing (format→compat→sig→entitlement→capability→decrypt).
   * Returns { ok, step, errors }.
   */
  async verifyWbmod(wbmod) {
    const errors = [];
    if (!wbmod || typeof wbmod !== 'object') return { ok: false, step: 'format', errors: ['invalid wbmod object'] };
    if (!wbmod.manifestName || !wbmod.data || !wbmod.iv || !wbmod.tag) return { ok: false, step: 'format', errors: ['missing iv/tag/data/manifestName'] };
    if (wbmod.v !== 1) return { ok: false, step: 'compatibility', errors: ['unsupported version'] };
    if (!wbmod.signature) errors.push('missing signature (dev unsigned)');
    return { ok: errors.length === 0, step: errors.length ? 'signature' : 'decrypt', errors };
  }

  /**
   * @param {string} event
   * @param {Function} handler
   */
  onRequest(event, handler) {
    this.handlers.set(event, handler);
  }

  /**
   * @param {string} event
   * @param {Function} handler
   */
  onEvent(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  /**
   * @param {string} event
   * @param {Function} handler
   */
  offEvent(event, handler) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * @template T
   * @param {string} event
   * @param {object} payload
   * @returns {Promise<T>}
   */
  async request(event, payload) {
    const handler = this.handlers.get(event);
    if (!handler) {
      throw new Error(`No handler for event: ${event}`);
    }
    return handler(payload);
  }

  /**
   * @param {string} event
   * @param {unknown} data
   * @returns {Promise<void>}
   */
  async emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      await Promise.all(Array.from(handlers).map(h => h(data)));
    }
  }

  /**
   * @param {Record<string, string>} config
   */
  setConfig(config) {
    this.config = { ...config };
  }

  /**
   * @returns {Record<string, string>}
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * @param {string} event
   * @param {unknown} data
   */
  simulateEvent(event, data) {
    this.emit(event, data);
  }
}