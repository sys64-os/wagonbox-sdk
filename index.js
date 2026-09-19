/**
 * WagonBox SDK - Main Entry Point
 * @module @wagonbox/sdk
 */

export { ShellGateway } from './lib/shell.js';
export { ConfigGateway } from './lib/config.js';
export { ApiClient } from './lib/api-client.js';
export { StorageGateway } from './lib/storage.js';
export { WagonboxModule } from './lib/module.js';
export { NetworkGateway } from './lib/network.js';
export { HardwareGateway } from './lib/hardware.js';
export { StorageMgmtGateway } from './lib/storage-mgmt.js';
export { LicenseGateway } from './lib/license.js';
export { UsersGateway } from './lib/users.js';
export { TerminalGateway } from './lib/terminal.js';
export { FilesGateway } from './lib/files.js';
export { AuditGateway } from './lib/audit.js';
export { CoreBridgeBase as CoreBridge, MockCoreBridge } from './lib/core-bridge.js';
export { CapabilitySet, CAPABILITY_GROUPS, createCapabilitySet, validateCapabilities, negotiateCapabilities } from './lib/capabilities.js';
export { PLUGIN_PROTOCOL, SDK_VERSION, DEFAULT_TIMEOUT_MS, CORE_CAPABILITIES } from './lib/constants.js';
export {
  WagonboxError,
  AuthRequiredError,
  AuthInvalidError,
  SessionExpiredError,
  ForbiddenError,
  CapabilityDeniedError,
  LicenseRequiredError,
  LicenseInvalidError,
  LicenseExpiredError,
  EntitlementDeniedError,
  ModuleInvalidError,
  ModuleIncompatibleError,
  ModuleSignatureInvalidError,
  HwidMismatchError,
  StepUpRequiredError,
  StepUpInvalidError,
  ValidationError,
  ResourceNotFoundError,
  ConflictError,
  RateLimitedError,
  InternalError,
  ERROR_CODES,
  createError,
  isErrorCode,
  ERROR_HTTP_STATUS,
} from './lib/errors.js';

/**
 * Initialization result type
 * @typedef {object} InitResult
 * @property {boolean} ok
 * @property {string} [error]
 * @property {WagonboxModuleContext} [context]
 */

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