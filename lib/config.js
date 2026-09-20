const CONFIG_READ_CAPABILITY = 'config.read';
const CONFIG_WRITE_CAPABILITY = 'config.write';

/**
 * Config Gateway for accessing encrypted system configuration.
 */
export class ConfigGateway {
  /**
   * @param {{ request: Function }} coreBridge
   * @param {Set<string>} capabilities
   */
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') {
      throw new Error('CoreBridge with request() method is required');
    }
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }

  requireReadCapability() {
    if (!this.capabilities.has(CONFIG_READ_CAPABILITY)) {
      throw new Error(`Capability required: ${CONFIG_READ_CAPABILITY}`);
    }
  }

  requireWriteCapability() {
    if (!this.capabilities.has(CONFIG_WRITE_CAPABILITY)) {
      throw new Error(`Capability required: ${CONFIG_WRITE_CAPABILITY}`);
    }
  }

  validateKey(key) {
    if (typeof key !== 'string' || !key.trim()) {
      throw new Error('Config key must be a non-empty string');
    }
    if (key.length > 128) {
      throw new Error('Config key too long (max 128 characters)');
    }
    return key.trim();
  }

  validateValue(value) {
    if (value === undefined || value === null) {
      throw new Error('Config value cannot be undefined or null');
    }
    return String(value);
  }

  /**
   * Gets a configuration value by key.
   * @param {string} key - Configuration key (e.g., 'network.interface', 'license.key')
   * @returns {Promise<string|null>}
   */
  async get(key) {
    this.requireReadCapability();

    const validatedKey = this.validateKey(key);

    const payload = { key: validatedKey };

    return this.coreBridge.request('CONFIG_GET', payload);
  }

  /**
   * Sets a configuration value.
   * Requires config.write capability.
   * @param {string} key - Configuration key
   * @param {string} value - Configuration value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    this.requireWriteCapability();

    const validatedKey = this.validateKey(key);
    const validatedValue = this.validateValue(value);

    const payload = { key: validatedKey, value: validatedValue };

    await this.coreBridge.request('CONFIG_SET', payload);
  }

  /**
   * Gets all configuration values.
   * @returns {Promise<Record<string, string>>}
   */
  async getAll() {
    this.requireReadCapability();

    return this.coreBridge.request('CONFIG_GET_ALL', {});
  }

  /**
   * Deletes a configuration value.
   * Requires config.write capability.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(key) {
    this.requireWriteCapability();

    const validatedKey = this.validateKey(key);

    const payload = { key: validatedKey };

    await this.coreBridge.request('CONFIG_DELETE', payload);
  }

  /**
   * Checks if a configuration key exists.
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    this.requireReadCapability();

    const validatedKey = this.validateKey(key);

    const result = await this.coreBridge.request('CONFIG_HAS', { key: validatedKey });
    return result.exists;
  }
}