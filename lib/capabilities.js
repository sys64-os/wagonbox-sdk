import { CORE_CAPABILITIES } from './constants.js';

/**
 * @typedef {typeof CORE_CAPABILITIES[number]} CoreCapability
 */

/**
 * CapabilitySet - A Set with additional helper methods for capabilities.
 * @extends Set<CoreCapability>
 */
export class CapabilitySet extends Set {
  /**
   * @param {CoreCapability[]} [capabilities]
   */
  constructor(capabilities = []) {
    super(capabilities);
  }

  /**
   * Check if all capabilities are present.
   * @param {...CoreCapability} caps
   * @returns {boolean}
   */
  hasAll(...caps) {
    return caps.every(c => this.has(c));
  }

  /**
   * Check if any capability is present.
   * @param {...CoreCapability} caps
   * @returns {boolean}
   */
  hasAny(...caps) {
    return caps.some(c => this.has(c));
  }

  /**
   * Add multiple capabilities.
   * @param {...CoreCapability} caps
   * @returns {this}
   */
  addAll(...caps) {
    caps.forEach(c => this.add(c));
    return this;
  }

  /**
   * Remove multiple capabilities.
   * @param {...CoreCapability} caps
   * @returns {this}
   */
  removeAll(...caps) {
    caps.forEach(c => this.delete(c));
    return this;
  }

  /**
   * Convert to JSON array.
   * @returns {string[]}
   */
  toJSON() {
    return Array.from(this);
  }

  /**
   * Create from JSON array.
   * @param {string[]} json
   * @returns {CapabilitySet}
   */
  static fromJSON(json) {
    return new CapabilitySet(json);
  }
}

export const CAPABILITY_GROUPS = {
  shell: ['shell.execute'],
  config: ['config.read', 'config.write'],
  api: ['api.register', 'api.call'],
  storage: ['storage.read', 'storage.write', 'storage.list', 'storage.remove'],
  system: ['system.read', 'system.manage'],
  network: ['network.read', 'network.configure'],
  storage_mgmt: ['storage.configure'],
  user: ['user.read', 'user.manage'],
  file: ['file.read', 'file.write'],
  terminal: ['terminal.execute'],
  license: ['license.read', 'license.activate'],
  cluster: ['cluster.read', 'cluster.manage'],
  audit: ['audit.read'],
  modules: ['modules.read', 'modules.manage'],
  all: CORE_CAPABILITIES,
};

/**
 * Create a CapabilitySet from group names.
 * @param {...('shell'|'config'|'api'|'storage'|'system'|'network'|'storage_mgmt'|'user'|'file'|'terminal'|'license'|'cluster'|'audit'|'modules'|'all')} groups
 * @returns {CapabilitySet}
 */
export function createCapabilitySet(...groups) {
  const caps = new CapabilitySet();
  for (const group of groups) {
    caps.addAll(...CAPABILITY_GROUPS[group]);
  }
  return caps;
}

/**
 * Validate capabilities against known list.
 * @param {string[]} capabilities
 * @returns {{ valid: CoreCapability[], invalid: string[] }}
 */
export function validateCapabilities(capabilities) {
  const valid = [];
  const invalid = [];

  for (const cap of capabilities) {
    if (CORE_CAPABILITIES.includes(cap)) {
      valid.push(cap);
    } else {
      invalid.push(cap);
    }
  }

  return { valid, invalid };
}

/**
 * Negotiate capabilities between requested and granted.
 * @param {CoreCapability[]} requested
 * @param {CoreCapability[]} granted
 * @returns {{ granted: CoreCapability[], denied: CoreCapability[] }}
 */
export function negotiateCapabilities(requested, granted) {
  const grantedSet = new Set(granted);
  const finalGranted = [];
  const denied = [];

  for (const cap of requested) {
    if (grantedSet.has(cap)) {
      finalGranted.push(cap);
    } else {
      denied.push(cap);
    }
  }

  return { granted: finalGranted, denied };
}