import { CORE_CAPABILITIES } from './constants.js';

const API_REGISTER_CAPABILITY = 'api.register';
const API_CALL_CAPABILITY = 'api.call';

/**
 * API Client for interacting with Core Engine API endpoints.
 */
export class ApiClient {
  /**
   * @param {{ request: Function }} coreBridge
   * @param {Set<string>} capabilities
   * @param {string} moduleId
   */
  constructor(coreBridge, capabilities, moduleId) {
    if (!coreBridge || typeof coreBridge.request !== 'function') {
      throw new Error('CoreBridge with request() method is required');
    }
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
    this.moduleId = moduleId;
  }

  requireCapability(capability) {
    if (!this.capabilities.has(capability)) {
      throw new Error(`Capability required: ${capability}`);
    }
  }

  validateMethod(method) {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const upper = method.toUpperCase();
    if (!validMethods.includes(upper)) {
      throw new Error(`Invalid HTTP method: ${method}`);
    }
    return upper;
  }

  validatePath(path) {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      throw new Error('Path must be a string starting with /');
    }
    if (path.length > 256) {
      throw new Error('Path too long (max 256 characters)');
    }
    return path;
  }

  validateHandler(handler) {
    if (typeof handler !== 'string' || !handler.trim()) {
      throw new Error('Handler must be a non-empty string');
    }
    return handler.trim();
  }

  validateScopes(scopes) {
    if (scopes === undefined || scopes === null) return undefined;
    if (!Array.isArray(scopes)) {
      throw new Error('Scopes must be an array of strings');
    }
    return scopes.map(s => String(s));
  }

  /**
   * Makes an HTTP request to the Core Engine API.
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
   * @param {string} path - API path (e.g., '/api/v1/network/interfaces')
   * @param {object} [data] - Request body data (for POST/PUT/PATCH)
   * @returns {Promise<any>}
   */
  async request(method, path, data = {}) {
    this.requireCapability(API_CALL_CAPABILITY);

    const validatedMethod = this.validateMethod(method);
    const validatedPath = this.validatePath(path);

    const payload = {
      moduleId: this.moduleId,
      method: validatedMethod,
      path: validatedPath,
      data,
    };

    return this.coreBridge.request('API_CALL', payload);
  }

  /**
   * Convenience method for GET requests.
   * @param {string} path
   * @returns {Promise<any>}
   */
  async get(path) {
    return this.request('GET', path);
  }

  /**
   * Convenience method for POST requests.
   * @param {string} path
   * @param {object} [data]
   * @returns {Promise<any>}
   */
  async post(path, data = {}) {
    return this.request('POST', path, data);
  }

  /**
   * Convenience method for PUT requests.
   * @param {string} path
   * @param {object} [data]
   * @returns {Promise<any>}
   */
  async put(path, data = {}) {
    return this.request('PUT', path, data);
  }

  /**
   * Convenience method for DELETE requests.
   * @param {string} path
   * @returns {Promise<any>}
   */
  async delete(path) {
    return this.request('DELETE', path);
  }

  /**
   * Convenience method for PATCH requests.
   * @param {string} path
   * @param {object} [data]
   * @returns {Promise<any>}
   */
  async patch(path, data = {}) {
    return this.request('PATCH', path, data);
  }

  /**
   * Registers a new API route on the Core Engine.
   * @param {string} route - Route path (e.g., '/status', '/config')
   * @param {string} handler - Handler method name in the module
   * @param {string[]} [scopes] - Optional OAuth scopes required for access
   * @returns {Promise<void>}
   */
  async registerRoute(route, handler, scopes = []) {
    this.requireCapability(API_REGISTER_CAPABILITY);

    const validatedRoute = this.validatePath(route);
    const validatedHandler = this.validateHandler(handler);
    const validatedScopes = this.validateScopes(scopes);

    const payload = {
      moduleId: this.moduleId,
      route: validatedRoute,
      handler: validatedHandler,
      scopes: validatedScopes,
    };

    await this.coreBridge.request('API_REGISTER', payload);
  }

  /**
   * Unregisters a previously registered route.
   * @param {string} route
   * @returns {Promise<void>}
   */
  async unregisterRoute(route) {
    this.requireCapability(API_REGISTER_CAPABILITY);

    const validatedRoute = this.validatePath(route);

    const payload = {
      moduleId: this.moduleId,
      route: validatedRoute,
    };

    await this.coreBridge.request('API_UNREGISTER', payload);
  }
}