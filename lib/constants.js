export const PLUGIN_PROTOCOL = 'wagonbox.plugin.v1';

export const SDK_VERSION = '1.0.0';

export const DEFAULT_TIMEOUT_MS = 30000;

export const CORE_CAPABILITIES = [
  'shell.execute',
  'config.read',
  'config.write',
  'api.register',
  'api.call',
  'storage.read',
  'storage.write',
  'storage.list',
  'storage.remove',
];

export const MANIFEST_NAME_PATTERN = /^wagonbox-[a-z0-9-]+$/;
export const CAPABILITY_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*(?::[a-z0-9._-]+)?$/;
export const ROUTE_PATH_PATTERN = /^\/[a-z0-9/_-]+$/;
export const HANDLER_NAME_PATTERN = /^[a-z][a-z0-9_.-]*$/;
export const SCOPE_PATTERN = /^[a-z][a-z0-9:_-]+$/;
export const NAMESPACE_PATTERN = /^[a-z0-9-]+$/;
export const METHOD_NAME_PATTERN = /^[a-z][a-z0-9_.-]*$/;
export const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_.-]*$/;