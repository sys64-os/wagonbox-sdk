import { ShellGateway } from './shell.js';
import { StorageGateway } from './storage.js';
import { ConfigGateway } from './config.js';
import { ApiClient } from './api-client.js';
import { CapabilitySet } from './capabilities.js';
import { NetworkGateway } from './network.js';
import { HardwareGateway } from './hardware.js';
import { StorageMgmtGateway } from './storage-mgmt.js';
import { LicenseGateway } from './license.js';
import { UsersGateway } from './users.js';
import { TerminalGateway } from './terminal.js';
import { FilesGateway } from './files.js';
import { AuditGateway } from './audit.js';

/**
 * Base Module Class for WagonBox extensions.
 */
export class WagonboxModule {
  /**
   * @param {object} context
   * @param {string} context.moduleId
   * @param {object} context.coreBridge
   * @param {string[]} [context.grantedCapabilities]
   * @param {Record<string, string>} [context.config]
   * @throws {Error} If context validation fails - use createModule() for safe instantiation
   */
  constructor(context) {
    if (!context) {
      throw new Error('Module context is required');
    }
    if (!context.moduleId) {
      throw new Error('moduleId is required in context');
    }
    if (!context.coreBridge || typeof context.coreBridge.request !== 'function') {
      throw new Error('coreBridge with request() method is required in context');
    }

    this.moduleId = context.moduleId;
    this.coreBridge = context.coreBridge;
    this.capabilities = new CapabilitySet(context.grantedCapabilities || []);

    this.shell = new ShellGateway(this.coreBridge, this.capabilities);
    this.storage = new StorageGateway(this.coreBridge, this.moduleId, this.capabilities);
    this.config = new ConfigGateway(this.coreBridge, this.capabilities);
    this.api = new ApiClient(this.coreBridge, this.capabilities, this.moduleId);
    this.network = new NetworkGateway(this.coreBridge, this.capabilities);
    this.hardware = new HardwareGateway(this.coreBridge, this.capabilities);
    this.storageMgmt = new StorageMgmtGateway(this.coreBridge, this.capabilities);
    this.license = new LicenseGateway(this.coreBridge, this.capabilities);
    this.users = new UsersGateway(this.coreBridge, this.capabilities);
    this.terminal = new TerminalGateway(this.coreBridge, this.capabilities);
    this.files = new FilesGateway(this.coreBridge, this.capabilities);
    this.audit = new AuditGateway(this.coreBridge, this.capabilities);
  }

  /**
   * Check if a capability is granted.
   * @param {string} cap
   * @returns {boolean}
   */
  hasCapability(cap) {
    return this.capabilities.has(cap);
  }

  /**
   * Throw if capability is not granted.
   * @param {string} cap
   */
  requireCapability(cap) {
    if (!this.hasCapability(cap)) {
      throw new Error(`Capability required: ${cap}`);
    }
  }

  /**
   * Called when the module is loaded and activated in RAM.
   * Override to perform initialization.
   * @returns {Promise<void>}
   */
  async onInit() {
    // Override in derived class
  }

  /**
   * Called after core is ready, safe to register routes.
   * Override to register API routes, start timers, etc.
   * @returns {Promise<void>}
   */
  async onStart() {
    // Override in derived class
  }

  /**
   * Called before module unload (graceful shutdown).
   * Override to stop timers, close connections, save state.
   * @returns {Promise<void>}
   */
  async onStop() {
    // Override in derived class
  }

  /**
   * Called for final cleanup after onStop.
   * @returns {Promise<void>}
   */
  async onDestroy() {
    // Override in derived class
  }

  /**
   * Register an API route (convenience method).
   * @param {string} method
   * @param {string} path
   * @param {string} handler
   * @param {string[]} [scopes]
   * @returns {Promise<void>}
   */
  async registerRoute(method, path, handler, scopes) {
    this.requireCapability('api.register');
    return this.api.registerRoute(method, path, handler, scopes);
  }

  /**
   * Register multiple API routes at once.
   * @param {Array<{ method: string; path: string; handler: string; scopes?: string[] }>} routes
   * @returns {Promise<void>}
   */
  async registerRoutes(routes) {
    for (const route of routes) {
      await this.registerRoute(route.method, route.path, route.handler, route.scopes);
    }
  }

  /**
   * Emit an event to other modules or the core.
   * @param {string} event
   * @param {unknown} data
   * @returns {Promise<void>}
   */
  async emitEvent(event, data) {
    return this.coreBridge.emitEvent(event, data);
  }

  /**
   * Subscribe to events.
   * @param {string} event
   * @param {Function} handler
   */
  onEvent(event, handler) {
    this.coreBridge.on(event, handler);
  }

  /**
   * Unsubscribe from events.
   * @param {string} event
   * @param {Function} handler
   */
  offEvent(event, handler) {
    this.coreBridge.off(event, handler);
  }

  /**
   * Call a method on another module via the core bridge.
   * @param {string} targetModule
   * @param {string} method
   * @param {unknown} params
   * @returns {Promise<any>}
   */
  async callModule(targetModule, method, params) {
    this.requireCapability('api.call');
    return this.coreBridge.request('MODULE_CALL', { targetModule, method, params });
  }
}