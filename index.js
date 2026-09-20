/**
 * WagonBox SDK - Main Entry Point
 * @module @wagonbox/sdk
 */

export { ShellGateway } from './lib/shell.js';
export { ConfigGateway } from './lib/config.js';
export { ApiClient } from './lib/api-client.js';
export { StorageGateway } from './lib/storage.js';
export { WagonboxModule, init, createModule, defineModule } from './lib/module.js';
export { NetworkGateway } from './lib/network.js';
export { HardwareGateway } from './lib/hardware.js';
export { StorageMgmtGateway } from './lib/storage-mgmt.js';
export { LicenseGateway } from './lib/license.js';
export { UsersGateway } from './lib/users.js';
export { TerminalGateway } from './lib/terminal.js';
export { FilesGateway } from './lib/files.js';
export { AuditGateway } from './lib/audit.js';
export { validateManifest } from './lib/manifest.js';
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