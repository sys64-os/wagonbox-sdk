import { ShellGateway } from './shell.js';
import { StorageGateway } from './storage.js';
import { ConfigGateway } from './config.js';
import { ApiClient } from './api-client.js';
import { CapabilitySet, negotiateCapabilities } from './capabilities.js';
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
    if (Array.isArray(context.requestedCapabilities)) {
      const { granted, denied } = negotiateCapabilities(context.requestedCapabilities, context.grantedCapabilities || []);
      this.capabilities = new CapabilitySet(granted);
      this.deniedCapabilities = denied;
      if (denied.length) this.coreBridge.emitEvent?.('module.capabilities.denied', { moduleId: context.moduleId, denied });
    } else {
      this.capabilities = new CapabilitySet(context.grantedCapabilities || []);
      this.deniedCapabilities = [];
    }

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
    this.coreBridge.emitEvent?.('module.init', { moduleId: this.moduleId });
  }

  async onStart() {
    this.coreBridge.emitEvent?.('module.start', { moduleId: this.moduleId });
  }

  async onStop() {
    this.coreBridge.emitEvent?.('module.stop', { moduleId: this.moduleId });
  }

  async onDestroy() {
    this.coreBridge.emitEvent?.('module.destroy', { moduleId: this.moduleId });
  }

  /**
   * Register an API route (convenience method).
   * @param {string} path - Route path (e.g., '/api/v1/modules/test/status')
   * @param {string} handler - Handler method name in the module
   * @param {string[]} [scopes] - Optional OAuth scopes required for access
   * @returns {Promise<void>}
   */
  async registerRoute(path, handler, scopes) {
    this.requireCapability('api.register');
    return this.api.registerRoute(path, handler, scopes);
  }

  /**
   * Register multiple API routes at once.
   * @param {Array<{ path: string; handler: string; scopes?: string[] }>} routes
   * @returns {Promise<void>}
   */
  async registerRoutes(routes) {
    for (const route of routes) {
      await this.registerRoute(route.path, route.handler, route.scopes);
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
   * @returns {Function} unsubscribe function
   */
  onEvent(event, handler) {
    return this.coreBridge.subscribe?.(event, handler) ?? (() => this.coreBridge.off?.(event, handler));
  }

  /**
   * Unsubscribe from events.
   * @param {string} event
   * @param {Function} handler
   */
  offEvent(event, handler) {
    this.coreBridge.off?.(event, handler);
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

/**
 * Validates and normalizes module context.
 * Does NOT throw - returns result object for safe error handling.
 *
 * @param {import('.').WagonboxModuleContext} context - The sandbox context.
 * @returns {InitResult}
 */
export function init(context) {
  if (!context) {
    return { ok: false, error: 'Context object is required' };
  }
  if (!context.coreBridge || typeof context.coreBridge.request !== 'function') {
    return { ok: false, error: 'CoreBridge with request() method is required' };
  }
  if (!context.moduleId || typeof context.moduleId !== 'string') {
    return { ok: false, error: 'moduleId (string) is required in context' };
  }
  if (!Array.isArray(context.grantedCapabilities)) {
    return { ok: false, error: 'grantedCapabilities must be an array' };
  }
  return { ok: true, context };
}

/**
 * Safe factory to create a WagonboxModule instance.
 * Returns null on validation failure instead of throwing.
 *
 * @param {import('.').WagonboxModuleContext} context
 * @returns {WagonboxModule | null}
 */
export function createModule(context) {
  const result = init(context);
  if (!result.ok) {
    return null;
  }
  return new WagonboxModule(result.context);
}

/**
 * Defines a module with safe initialization pattern.
 * Recommended entry point for .wbmod plugins.
 *
 * @param {object} options
 * @param {Function} options.createModule - Factory function receiving validated context, returns module instance
 * @param {Function} [options.onError] - Called if initialization fails
 * @returns {object} Module initialization handler
 *
 * @example
 * // plugin entry point (dist/index.js)
 * import { defineModule } from '@wagonbox/sdk';
 * import MyModule from './MyModule.js';
 *
 * export default defineModule({
 *   createModule: (ctx) => new MyModule(ctx),
 *   onError: (err) => console.error('Module init failed:', err)
 * });
 */
export function defineModule({ createModule: factory, onError }) {
  let moduleInstance = null;
  let initError = null;

  return {
    /**
     * Initialize the module with sandbox context.
     * Safe to call multiple times - only first call executes.
     */
    init(context) {
      if (moduleInstance || initError) return;

      const result = init(context);
      if (!result.ok) {
        initError = new Error(result.error);
        onError?.(initError);
        return;
      }

      try {
        moduleInstance = factory(result.context);
      } catch (err) {
        initError = err;
        onError?.(err);
        moduleInstance = null;
      }
    },

    /** Get the initialized module instance */
    getModule() {
      return moduleInstance;
    },

    /** Get initialization error if any */
    getError() {
      return initError;
    },

    /** Check if module is ready */
    isReady() {
      return moduleInstance !== null && initError === null;
    }
  };
}