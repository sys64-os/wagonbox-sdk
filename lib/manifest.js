import { CORE_CAPABILITIES, MANIFEST_NAME_PATTERN, PLUGIN_PROTOCOL } from './constants.js';
import { validateCapabilities } from './capabilities.js';

export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') return { valid: false, errors: ['manifest must be object'] };
  if (!MANIFEST_NAME_PATTERN.test(manifest.name || '')) errors.push('name must match wagonbox-<name>');
  if (typeof manifest.version !== 'string' || !/^\d+\.\d+\.\d+/.test(manifest.version)) errors.push('version must be semver');
  if (manifest.sdkApi !== PLUGIN_PROTOCOL) errors.push(`sdkApi must be ${PLUGIN_PROTOCOL}`);
  if (typeof manifest.minCoreVersion !== 'string' || !manifest.minCoreVersion) errors.push('minCoreVersion required');
  if (typeof manifest.entryPoint !== 'string' || !manifest.entryPoint) errors.push('entryPoint required');
  if (typeof manifest.apiNamespace !== 'string' || !manifest.apiNamespace) errors.push('apiNamespace required');
  if (!Array.isArray(manifest.requestedCapabilities)) errors.push('requestedCapabilities must be array');
  else {
    const { invalid } = validateCapabilities(manifest.requestedCapabilities);
    if (invalid.length) errors.push(`invalid capabilities: ${invalid.join(',')}`);
  }
  if (!CORE_CAPABILITIES.includes) {} // keep import used
  if (manifest.methods && !Array.isArray(manifest.methods)) errors.push('methods must be array');
  return { valid: errors.length === 0, errors };
}
