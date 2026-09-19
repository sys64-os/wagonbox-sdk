export const PLUGIN_PROTOCOL = 'wagonbox.plugin.v1';

export const SDK_VERSION = '1.0.0';

export const DEFAULT_TIMEOUT_MS = 30000;

export const CORE_CAPABILITIES = [
  // Shell & Execution
  'shell.execute',

  // Configuration
  'config.read',
  'config.write',

  // API Management
  'api.register',
  'api.call',

  // Storage (workspace)
  'storage.read',
  'storage.write',
  'storage.list',
  'storage.remove',

  // System Management (per system-architecture.md)
  'system.read',
  'system.manage',

  // Network Management
  'network.read',
  'network.configure',

  // Storage Management (LVM, volumes)
  'storage.configure',

  // User & Access Management
  'user.read',
  'user.manage',

  // File System (system-wide)
  'file.read',
  'file.write',

  // Terminal
  'terminal.execute',

  // License
  'license.read',
  'license.activate',

  // Cluster
  'cluster.read',
  'cluster.manage',

  // Audit
  'audit.read',

  // Module Management
  'modules.read',
  'modules.manage',
];

export const MANIFEST_NAME_PATTERN = /^wagonbox-[a-z0-9-]+$/;
export const CAPABILITY_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*(?::[a-z0-9._-]+)?$/;
export const ROUTE_PATH_PATTERN = /^\/[a-z0-9/_-]+$/;
export const HANDLER_NAME_PATTERN = /^[a-z][a-z0-9_.-]*$/;
export const SCOPE_PATTERN = /^[a-z][a-z0-9:_-]+$/;
export const NAMESPACE_PATTERN = /^[a-z0-9-]+$/;
export const METHOD_NAME_PATTERN = /^[a-z][a-z0-9_.-]*$/;
export const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_.-]*$/;