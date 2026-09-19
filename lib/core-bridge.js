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