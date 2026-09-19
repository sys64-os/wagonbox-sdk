// WagonBox SDK - TypeScript Type Definitions
// Provides type safety for module development using @wagonbox/sdk.

import { EventEmitter } from 'node:events';

/**
 * Protocol version for plugin-core communication.
 */
export const PLUGIN_PROTOCOL = 'wagonbox.plugin.v1' as const;

/**
 * Error codes per api.md §39
 */
export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'CAPABILITY_DENIED'
  | 'LICENSE_REQUIRED'
  | 'LICENSE_INVALID'
  | 'LICENSE_EXPIRED'
  | 'ENTITLEMENT_DENIED'
  | 'MODULE_INVALID'
  | 'MODULE_INCOMPATIBLE'
  | 'MODULE_SIGNATURE_INVALID'
  | 'HWID_MISMATCH'
  | 'STEP_UP_REQUIRED'
  | 'STEP_UP_INVALID'
  | 'VALIDATION_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export const ERROR_CODES: Record<ErrorCode, ErrorCode> = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  CAPABILITY_DENIED: 'CAPABILITY_DENIED',
  LICENSE_REQUIRED: 'LICENSE_REQUIRED',
  LICENSE_INVALID: 'LICENSE_INVALID',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  ENTITLEMENT_DENIED: 'ENTITLEMENT_DENIED',
  MODULE_INVALID: 'MODULE_INVALID',
  MODULE_INCOMPATIBLE: 'MODULE_INCOMPATIBLE',
  MODULE_SIGNATURE_INVALID: 'MODULE_SIGNATURE_INVALID',
  HWID_MISMATCH: 'HWID_MISMATCH',
  STEP_UP_REQUIRED: 'STEP_UP_REQUIRED',
  STEP_UP_INVALID: 'STEP_UP_INVALID',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export interface WagonboxErrorDetails {
  code: ErrorCode;
  message: string;
  details?: unknown;
  statusCode?: number;
}

export declare class WagonboxError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly statusCode: number;
  constructor(details: WagonboxErrorDetails);
  toJSON(): Record<string, unknown>;
  static isWagonboxError(error: unknown): error is WagonboxError;
}

export declare class AuthRequiredError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class AuthInvalidError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class SessionExpiredError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class ForbiddenError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class CapabilityDeniedError extends WagonboxError {
  constructor(capability: string, details?: unknown);
}
export declare class LicenseRequiredError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class LicenseInvalidError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class LicenseExpiredError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class EntitlementDeniedError extends WagonboxError {
  constructor(feature: string, details?: unknown);
}
export declare class ModuleInvalidError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class ModuleIncompatibleError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class ModuleSignatureInvalidError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class HwidMismatchError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class StepUpRequiredError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class StepUpInvalidError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class ValidationError extends WagonboxError {
  constructor(message: string, details?: unknown);
}
export declare class ResourceNotFoundError extends WagonboxError {
  constructor(resource: string, details?: unknown);
}
export declare class ConflictError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class RateLimitedError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}
export declare class InternalError extends WagonboxError {
  constructor(message?: string, details?: unknown);
}

export function createError(code: ErrorCode, message: string, details?: unknown): WagonboxError;
export function isErrorCode(code: string): code is ErrorCode;
export const ERROR_HTTP_STATUS: Record<ErrorCode, number>;

/**
 * Core capabilities that modules can request.
 */
export type CoreCapability =
  | 'shell.execute'
  | 'config.read'
  | 'config.write'
  | 'api.register'
  | 'api.call'
  | 'storage.read'
  | 'storage.write'
  | 'storage.list'
  | 'storage.remove'
  | 'system.read'
  | 'system.manage'
  | 'network.read'
  | 'network.configure'
  | 'storage.configure'
  | 'user.read'
  | 'user.manage'
  | 'file.read'
  | 'file.write'
  | 'terminal.execute'
  | 'license.read'
  | 'license.activate'
  | 'cluster.read'
  | 'cluster.manage'
  | 'audit.read'
  | 'modules.read'
  | 'modules.manage';

/**
 * Context injected into a module by the Naked Kernel V8 Sandbox.
 */
export interface WagonboxModuleContext {
  moduleId: string;
  coreBridge: CoreBridge;
  grantedCapabilities: CoreCapability[];
  config: Record<string, string>;
}

/** @deprecated Use WagonboxModuleContext instead */
export type ModuleContext = WagonboxModuleContext;

/**
 * Core Bridge interface for module-core communication.
 */
export interface CoreBridge {
  request<T>(event: string, payload: object): Promise<T>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: unknown[]) => void): void;
  emitEvent(event: string, data: unknown): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getGrantedCapabilities(): ReadonlySet<CoreCapability>;
}

/**
 * Shell execution options.
 */
export interface ShellExecuteOptions {
  /** Require sudo elevation (triggers interactive PAM challenge) */
  requireSudo?: boolean;
  /** User session token for sudo validation */
  userSession?: string;
  /** Command timeout in milliseconds */
  timeout?: number;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Shell execution result.
 */
export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  /** Process ID (if available) */
  pid?: number;
}

/**
 * Spawned process handle for long-running commands.
 */
export interface ShellSpawnHandle {
  /** Process ID */
  pid: number;
  /** Readable stdout stream */
  stdout: NodeJS.ReadableStream;
  /** Readable stderr stream */
  stderr: NodeJS.ReadableStream;
  /** Writable stdin stream */
  stdin: NodeJS.WritableStream;
  /** Wait for process to exit */
  wait(): Promise<ShellResult>;
  /** Send signal to process */
  kill(signal?: NodeJS.Signals): void;
}

/**
 * Storage gateway interface.
 */
export interface StorageGateway {
  /** Get the absolute workspace path for this module */
  getWorkspacePath(): string;
  /** Read file content (relative to workspace) */
  read(relPath: string): Promise<string>;
  /** Write file content (relative to workspace) */
  write(relPath: string, data: string): Promise<void>;
  /** List directory entries (relative to workspace) */
  list(relPath: string): Promise<string[]>;
  /** Check if path exists (relative to workspace) */
  exists(relPath: string): Promise<boolean>;
  /** Remove file or directory (relative to workspace) */
  remove(relPath: string): Promise<void>;
}

/**
 * Config gateway interface.
 */
export interface ConfigGateway {
  /** Get configuration value by key */
  get(key: string): Promise<string | null>;
  /** Set configuration value (requires config.write capability) */
  set(key: string, value: string): Promise<void>;
  /** Get all configuration values */
  getAll(): Promise<Record<string, string>>;
}

/**
 * API client interface.
 */
export interface ApiClient {
  /** Make HTTP request to Core Engine API */
  request<T>(method: string, path: string, data?: object): Promise<T>;
  /** Register a new API route on the Core Engine */
  registerRoute(route: string, handler: string, scopes?: string[]): Promise<void>;
}

/**
 * Module manifest structure (manifest.json).
 */
export interface ModuleManifest {
  /** Module name (must match wagonbox-<name> pattern) */
  name: string;
  /** Semantic version */
  version: string;
  /** SDK protocol version */
  sdkApi: typeof PLUGIN_PROTOCOL;
  /** Minimum core version required */
  minCoreVersion: string;
  /** License identifier */
  license: string;
  /** License disclaimer (optional) */
  licenseDisclaimer?: string;
  /** Entry point file (relative to module root) */
  entryPoint: string;
  /** Requested capabilities */
  requestedCapabilities: CoreCapability[];
  /** Requested OAuth scopes (optional) */
  requestedScopes?: string[];
  /** API namespace for route isolation */
  apiNamespace: string;
  /** WebSocket namespace (optional) */
  socketNamespace?: string;
  /** Exported method names */
  methods: string[];
  /** HTTP routes to register */
  routes?: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    handler: string;
    scopes?: string[];
  }>;
  /** Event names to emit/listen */
  events?: string[];
  /** Dependencies on other modules */
  dependencies?: string[];
}

/**
 * Main Module Class to be extended by module developers.
 */
export declare class WagonboxModule {
  /**
   * @param context - The sandbox context injected by Core Engine
   */
  constructor(context: WagonboxModuleContext);

  /** Module identifier */
  readonly moduleId: string;
  /** Core bridge instance */
  readonly coreBridge: CoreBridge;
  /** Granted capabilities */
  readonly capabilities: ReadonlySet<CoreCapability>;
  /** Shell gateway */
  readonly shell: ShellGateway;
  /** Storage gateway */
  readonly storage: StorageGateway;
  /** Config gateway */
  readonly config: ConfigGateway;
  /** API client */
  readonly api: ApiClient;

  /** Check if capability is granted */
  hasCapability(cap: CoreCapability): boolean;
  /** Throw if capability not granted */
  requireCapability(cap: CoreCapability): void;

  /** Called when module is loaded and activated in RAM */
  onInit(): Promise<void>;
  /** Called after core is ready, safe to register routes */
  onStart(): Promise<void>;
  /** Called before module unload */
  onStop(): Promise<void>;
  /** Called for final cleanup */
  onDestroy(): Promise<void>;

  /** Register an API route (convenience method) */
  registerRoute(method: string, path: string, handler: string, scopes?: string[]): Promise<void>;
}

/**
 * Shell Gateway for secure command execution.
 */
export declare class ShellGateway {
  constructor(coreBridge: CoreBridge, capabilities: ReadonlySet<CoreCapability>);

  /** Execute command and wait for completion */
  execute(command: string, args?: string[], options?: ShellExecuteOptions): Promise<ShellResult>;
  /** Spawn long-running command with streams */
  spawn(command: string, args?: string[], options?: ShellExecuteOptions): Promise<ShellSpawnHandle>;
}

/**
 * Initialization result type.
 */
export interface InitResult {
  ok: boolean;
  error?: string;
  context?: WagonboxModuleContext;
}

/**
 * Validates and normalizes module context.
 * Does NOT throw - returns result object for safe error handling.
 */
export function init(context: WagonboxModuleContext): InitResult;

/**
 * Safe factory to create a WagonboxModule instance.
 * Returns null on validation failure instead of throwing.
 */
export function createModule(context: WagonboxModuleContext): WagonboxModule | null;

/**
 * Module definition handler returned by defineModule.
 */
export interface ModuleDefinition {
  /** Initialize the module with sandbox context. Safe to call multiple times. */
  init(context: WagonboxModuleContext): void;
  /** Get the initialized module instance */
  getModule(): WagonboxModule | null;
  /** Get initialization error if any */
  getError(): Error | null;
  /** Check if module is ready */
  isReady(): boolean;
}

/**
 * Options for defineModule.
 */
export interface DefineModuleOptions {
  /** Factory function receiving validated context, returns module instance */
  createModule: (context: WagonboxModuleContext) => WagonboxModule;
  /** Called if initialization fails */
  onError?: (error: Error) => void;
}

/**
 * Defines a module with safe initialization pattern.
 * Recommended entry point for .wbmod plugins.
 */
export function defineModule(options: DefineModuleOptions): ModuleDefinition;

/**
 * Capability utilities.
 */
export declare class CapabilitySet extends Set<CoreCapability> {
  constructor(capabilities?: CoreCapability[]);
  hasAll(...caps: CoreCapability[]): boolean;
  hasAny(...caps: CoreCapability[]): boolean;
  addAll(...caps: CoreCapability[]): this;
  removeAll(...caps: CoreCapability[]): this;
  toJSON(): string[];
  static fromJSON(json: string[]): CapabilitySet;
}

export const CAPABILITY_GROUPS: {
  shell: CoreCapability[];
  config: CoreCapability[];
  api: CoreCapability[];
  storage: CoreCapability[];
  system: CoreCapability[];
  network: CoreCapability[];
  storage_mgmt: CoreCapability[];
  user: CoreCapability[];
  file: CoreCapability[];
  terminal: CoreCapability[];
  license: CoreCapability[];
  cluster: CoreCapability[];
  audit: CoreCapability[];
  modules: CoreCapability[];
  all: CoreCapability[];
};

export function createCapabilitySet(...groups: ('shell' | 'config' | 'api' | 'storage' | 'system' | 'network' | 'storage_mgmt' | 'user' | 'file' | 'terminal' | 'license' | 'cluster' | 'audit' | 'modules' | 'all')[]): CapabilitySet;
export function validateCapabilities(capabilities: string[]): { valid: CoreCapability[]; invalid: string[] };
export function negotiateCapabilities(requested: CoreCapability[], granted: CoreCapability[]): { granted: CoreCapability[]; denied: CoreCapability[] };

/**
 * Mock Core Bridge for testing.
 */
export declare class MockCoreBridge extends EventEmitter implements CoreBridge {
  constructor(grantedCapabilities?: CoreCapability[]);
  onRequest(event: string, handler: (payload: object) => Promise<unknown>): void;
  onEvent(event: string, handler: (data: unknown) => void): void;
  offEvent(event: string, handler: (data: unknown) => void): void;
  setConfig(config: Record<string, string>): void;
  getConfig(): Record<string, string>;
  simulateEvent(event: string, data: unknown): void;
}

/**
 * Error class exports
 */
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
  type ErrorCode,
  createError,
  isErrorCode,
  ERROR_HTTP_STATUS,
};