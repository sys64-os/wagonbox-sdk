import { createRequire } from "module";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// lib/shell.js
import { Readable, Writable } from "node:stream";
var SHELL_EXECUTE_CAPABILITY = "shell.execute";
var ShellSpawnHandleInternal = class {
  static {
    __name(this, "ShellSpawnHandleInternal");
  }
  /**
   * @param {{ request: Function }} coreBridge
   * @param {string} requestId
   * @param {number} pid
   */
  constructor(coreBridge, requestId, pid) {
    this.coreBridge = coreBridge;
    this.requestId = requestId;
    this.pid = pid;
    this.stdout = new Readable({
      read() {
      },
      destroy() {
        this.destroyed = true;
      }
    });
    this.stderr = new Readable({
      read() {
      },
      destroy() {
        this.destroyed = true;
      }
    });
    this.stdin = new Writable({
      write: /* @__PURE__ */ __name((chunk, encoding, callback) => {
        this.sendStdin(chunk).then(() => callback()).catch(callback);
      }, "write"),
      final: /* @__PURE__ */ __name((callback) => {
        this.closeStdin().then(() => callback()).catch(callback);
      }, "final")
    });
    this.stdin.destroy = this.destroy.bind(this);
    this.closed = false;
    this.waitPromise = null;
  }
  async sendStdin(chunk) {
    if (this.closed) throw new Error("Process already closed");
    await this.coreBridge.request("SHELL_STDIN", {
      requestId: this.requestId,
      data: chunk.toString()
    });
  }
  async closeStdin() {
    if (this.closed) return;
    await this.coreBridge.request("SHELL_STDIN_CLOSE", { requestId: this.requestId });
  }
  async wait() {
    if (this.waitPromise) return this.waitPromise;
    this.waitPromise = (async () => {
      const result = await this.coreBridge.request("SHELL_WAIT", { requestId: this.requestId });
      this.close();
      return result;
    })();
    return this.waitPromise;
  }
  kill(signal = "SIGTERM") {
    if (this.closed) return;
    this.coreBridge.request("SHELL_SIGNAL", {
      requestId: this.requestId,
      signal
    }).catch(() => {
    });
  }
  close() {
    this.closed = true;
    this.stdout.destroy();
    this.stderr.destroy();
    this.stdin.destroy();
  }
  destroy() {
    this.close();
  }
  pushStdout(data) {
    if (!this.closed) this.stdout.push(data);
  }
  pushStderr(data) {
    if (!this.closed) this.stderr.push(data);
  }
  endStdout() {
    this.stdout.push(null);
  }
  endStderr() {
    this.stderr.push(null);
  }
};
var ShellGateway = class {
  static {
    __name(this, "ShellGateway");
  }
  /**
   * @param {{ request: Function }} coreBridge
   * @param {Set<string>} capabilities
   */
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") {
      throw new Error("CoreBridge with request() method is required");
    }
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireCapability() {
    if (!this.capabilities.has(SHELL_EXECUTE_CAPABILITY)) {
      throw new Error(`Capability required: ${SHELL_EXECUTE_CAPABILITY}`);
    }
  }
  validateCommand(command) {
    if (typeof command !== "string" || !command.trim()) {
      throw new Error("Command must be a non-empty string");
    }
    return command.trim();
  }
  validateArgs(args) {
    if (args === void 0 || args === null) {
      return [];
    }
    if (!Array.isArray(args)) {
      throw new Error("Command arguments must be an array of strings (Anti-Injection parameterization)");
    }
    return args.map((arg) => String(arg));
  }
  validateOptions(options) {
    if (options === void 0 || options === null) {
      return {};
    }
    if (typeof options !== "object") {
      throw new Error("Options must be an object");
    }
    const opts = options;
    return {
      requireSudo: Boolean(opts.requireSudo),
      userSession: opts.userSession ? String(opts.userSession) : void 0,
      timeout: typeof opts.timeout === "number" && opts.timeout > 0 ? opts.timeout : 3e4,
      cwd: opts.cwd ? String(opts.cwd) : void 0,
      env: opts.env && typeof opts.env === "object" ? opts.env : void 0
    };
  }
  /**
   * Executes a system command safely via Core Engine Gatekeeper.
   * @param {string} command - Base command (e.g., 'systemctl', 'nmcli')
   * @param {string[]} [args] - Parameter array (Anti-Shell Injection)
   * @param {ShellExecuteOptions} [options] - Execution options
   * @returns {Promise<ShellExecuteResult>}
   */
  async execute(command, args = [], options = {}) {
    this.requireCapability();
    const validatedCommand = this.validateCommand(command);
    const validatedArgs = this.validateArgs(args);
    const validatedOptions = this.validateOptions(options);
    const payload = {
      command: validatedCommand,
      args: validatedArgs,
      requireSudo: validatedOptions.requireSudo,
      userSession: validatedOptions.userSession,
      timeout: validatedOptions.timeout,
      cwd: validatedOptions.cwd,
      env: validatedOptions.env
    };
    return this.coreBridge.request("SHELL_EXECUTE", payload);
  }
  /**
   * Spawns a long-running command with stream access.
   * @param {string} command - Base command (e.g., 'tail', 'ping')
   * @param {string[]} [args] - Parameter array
   * @param {ShellExecuteOptions} [options] - Execution options
   * @returns {Promise<ShellSpawnHandle>}
   */
  async spawn(command, args = [], options = {}) {
    this.requireCapability();
    const validatedCommand = this.validateCommand(command);
    const validatedArgs = this.validateArgs(args);
    const validatedOptions = this.validateOptions(options);
    const payload = {
      command: validatedCommand,
      args: validatedArgs,
      requireSudo: validatedOptions.requireSudo,
      userSession: validatedOptions.userSession,
      timeout: validatedOptions.timeout,
      cwd: validatedOptions.cwd,
      env: validatedOptions.env,
      spawn: true
    };
    const result = await this.coreBridge.request("SHELL_SPAWN", payload);
    return new ShellSpawnHandleInternal(this.coreBridge, result.requestId, result.pid);
  }
};

// lib/config.js
var CONFIG_READ_CAPABILITY = "config.read";
var CONFIG_WRITE_CAPABILITY = "config.write";
var ConfigGateway = class {
  static {
    __name(this, "ConfigGateway");
  }
  /**
   * @param {{ request: Function }} coreBridge
   * @param {Set<string>} capabilities
   */
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") {
      throw new Error("CoreBridge with request() method is required");
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
    if (typeof key !== "string" || !key.trim()) {
      throw new Error("Config key must be a non-empty string");
    }
    if (key.length > 128) {
      throw new Error("Config key too long (max 128 characters)");
    }
    return key.trim();
  }
  validateValue(value) {
    if (value === void 0 || value === null) {
      throw new Error("Config value cannot be undefined or null");
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
    return this.coreBridge.request("CONFIG_GET", payload);
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
    await this.coreBridge.request("CONFIG_SET", payload);
  }
  /**
   * Gets all configuration values.
   * @returns {Promise<Record<string, string>>}
   */
  async getAll() {
    this.requireReadCapability();
    return this.coreBridge.request("CONFIG_GET_ALL", {});
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
    await this.coreBridge.request("CONFIG_DELETE", payload);
  }
  /**
   * Checks if a configuration key exists.
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    this.requireReadCapability();
    const validatedKey = this.validateKey(key);
    const result = await this.coreBridge.request("CONFIG_HAS", { key: validatedKey });
    return result.exists;
  }
};

// lib/api-client.js
var API_REGISTER_CAPABILITY = "api.register";
var API_CALL_CAPABILITY = "api.call";
var ApiClient = class {
  static {
    __name(this, "ApiClient");
  }
  /**
   * @param {{ request: Function }} coreBridge
   * @param {Set<string>} capabilities
   * @param {string} moduleId
   */
  constructor(coreBridge, capabilities, moduleId) {
    if (!coreBridge || typeof coreBridge.request !== "function") {
      throw new Error("CoreBridge with request() method is required");
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
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
    const upper = method.toUpperCase();
    if (!validMethods.includes(upper)) {
      throw new Error(`Invalid HTTP method: ${method}`);
    }
    return upper;
  }
  validatePath(path) {
    if (typeof path !== "string" || !path.startsWith("/")) {
      throw new Error("Path must be a string starting with /");
    }
    if (path.length > 256) {
      throw new Error("Path too long (max 256 characters)");
    }
    return path;
  }
  validateHandler(handler) {
    if (typeof handler !== "string" || !handler.trim()) {
      throw new Error("Handler must be a non-empty string");
    }
    return handler.trim();
  }
  validateScopes(scopes) {
    if (scopes === void 0 || scopes === null) return void 0;
    if (!Array.isArray(scopes)) {
      throw new Error("Scopes must be an array of strings");
    }
    return scopes.map((s) => String(s));
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
      data
    };
    return this.coreBridge.request("API_CALL", payload);
  }
  /**
   * Convenience method for GET requests.
   * @param {string} path
   * @returns {Promise<any>}
   */
  async get(path) {
    return this.request("GET", path);
  }
  /**
   * Convenience method for POST requests.
   * @param {string} path
   * @param {object} [data]
   * @returns {Promise<any>}
   */
  async post(path, data = {}) {
    return this.request("POST", path, data);
  }
  /**
   * Convenience method for PUT requests.
   * @param {string} path
   * @param {object} [data]
   * @returns {Promise<any>}
   */
  async put(path, data = {}) {
    return this.request("PUT", path, data);
  }
  /**
   * Convenience method for DELETE requests.
   * @param {string} path
   * @returns {Promise<any>}
   */
  async delete(path) {
    return this.request("DELETE", path);
  }
  /**
   * Convenience method for PATCH requests.
   * @param {string} path
   * @param {object} [data]
   * @returns {Promise<any>}
   */
  async patch(path, data = {}) {
    return this.request("PATCH", path, data);
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
      scopes: validatedScopes
    };
    await this.coreBridge.request("API_REGISTER", payload);
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
      route: validatedRoute
    };
    await this.coreBridge.request("API_UNREGISTER", payload);
  }
};

// lib/storage.js
import { resolve, relative } from "node:path";
var STORAGE_READ_CAPABILITY = "storage.read";
var STORAGE_WRITE_CAPABILITY = "storage.write";
var STORAGE_LIST_CAPABILITY = "storage.list";
var STORAGE_REMOVE_CAPABILITY = "storage.remove";
var StorageGateway = class {
  static {
    __name(this, "StorageGateway");
  }
  /**
   * @param {{ request: Function }} coreBridge
   * @param {string} moduleId
   * @param {Set<string>} capabilities
   */
  constructor(coreBridge, moduleId, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") {
      throw new Error("CoreBridge with request() method is required");
    }
    if (!moduleId || typeof moduleId !== "string") {
      throw new Error("moduleId must be a non-empty string");
    }
    this.coreBridge = coreBridge;
    this.moduleId = moduleId;
    this.capabilities = capabilities;
    this.workspacePath = `/opt/wagonbox/data/${moduleId}`;
  }
  requireReadCapability() {
    if (!this.capabilities.has(STORAGE_READ_CAPABILITY)) {
      throw new Error(`Capability required: ${STORAGE_READ_CAPABILITY}`);
    }
  }
  requireWriteCapability() {
    if (!this.capabilities.has(STORAGE_WRITE_CAPABILITY)) {
      throw new Error(`Capability required: ${STORAGE_WRITE_CAPABILITY}`);
    }
  }
  requireListCapability() {
    if (!this.capabilities.has(STORAGE_LIST_CAPABILITY)) {
      throw new Error(`Capability required: ${STORAGE_LIST_CAPABILITY}`);
    }
  }
  requireRemoveCapability() {
    if (!this.capabilities.has(STORAGE_REMOVE_CAPABILITY)) {
      throw new Error(`Capability required: ${STORAGE_REMOVE_CAPABILITY}`);
    }
  }
  validateRelativePath(relPath) {
    if (typeof relPath !== "string") {
      throw new Error("Path must be a string");
    }
    if (!relPath || relPath.trim() === "") {
      throw new Error("Path cannot be empty");
    }
    let normalized = relPath.trim();
    if (normalized.startsWith("/") || normalized.includes("://")) {
      throw new Error("Absolute paths and URLs not allowed");
    }
    try {
      normalized = decodeURIComponent(normalized);
    } catch {
    }
    if (normalized.includes("..")) {
      throw new Error("Path traversal not allowed (..)");
    }
    normalized = normalized.replace(/^\/+/, "");
    const fullPath = resolve(this.workspacePath, normalized);
    const relativePath = relative(this.workspacePath, fullPath);
    if (relativePath.startsWith("..") || relativePath === "") {
      throw new Error("Path traversal not allowed");
    }
    return normalized;
  }
  /**
   * Gets the absolute workspace path for this module.
   * @returns {string}
   */
  getWorkspacePath() {
    return this.workspacePath;
  }
  /**
   * Reads file content from the module's isolated workspace.
   * @param {string} relPath - Path relative to workspace
   * @returns {Promise<string>}
   */
  async read(relPath) {
    this.requireReadCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = { moduleId: this.moduleId, path: validatedPath };
    return this.coreBridge.request("STORAGE_READ", payload);
  }
  /**
   * Reads file content as Buffer (for binary files).
   * @param {string} relPath
   * @returns {Promise<Buffer>}
   */
  async readBuffer(relPath) {
    this.requireReadCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = { moduleId: this.moduleId, path: validatedPath, encoding: "buffer" };
    return this.coreBridge.request("STORAGE_READ", payload);
  }
  /**
   * Writes file content to the module's isolated workspace.
   * @param {string} relPath
   * @param {string|Buffer} data
   * @returns {Promise<void>}
   */
  async write(relPath, data) {
    this.requireWriteCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = {
      moduleId: this.moduleId,
      path: validatedPath,
      data: data instanceof Buffer ? data.toString("base64") : data,
      encoding: data instanceof Buffer ? "base64" : "utf8"
    };
    await this.coreBridge.request("STORAGE_WRITE", payload);
  }
  /**
   * Appends content to a file.
   * @param {string} relPath
   * @param {string} data
   * @returns {Promise<void>}
   */
  async append(relPath, data) {
    this.requireWriteCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = {
      moduleId: this.moduleId,
      path: validatedPath,
      data
    };
    await this.coreBridge.request("STORAGE_APPEND", payload);
  }
  /**
   * Lists directory entries in the module's workspace.
   * @param {string} [relPath='.']
   * @returns {Promise<string[]>}
   */
  async list(relPath = ".") {
    this.requireListCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = { moduleId: this.moduleId, path: validatedPath };
    const result = await this.coreBridge.request("STORAGE_LIST", payload);
    return result.entries || [];
  }
  /**
   * Lists directory entries with metadata.
   * @param {string} [relPath='.']
   * @returns {Promise<Array<{ name: string; size: number; mtime: number; isDirectory: boolean }>>}
   */
  async listWithMeta(relPath = ".") {
    this.requireListCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = { moduleId: this.moduleId, path: validatedPath, withMeta: true };
    const result = await this.coreBridge.request("STORAGE_LIST", payload);
    return result.entries || [];
  }
  /**
   * Checks if a path exists in the module's workspace.
   * @param {string} relPath
   * @returns {Promise<boolean>}
   */
  async exists(relPath) {
    this.requireReadCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = { moduleId: this.moduleId, path: validatedPath };
    const result = await this.coreBridge.request("STORAGE_EXISTS", payload);
    return result.exists;
  }
  /**
   * Gets file/directory metadata.
   * @param {string} relPath
   * @returns {Promise<{ size: number; mtime: number; isDirectory: boolean; isFile: boolean }>}
   */
  async stat(relPath) {
    this.requireReadCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = { moduleId: this.moduleId, path: validatedPath };
    return this.coreBridge.request("STORAGE_STAT", payload);
  }
  /**
   * Removes a file or directory.
   * @param {string} relPath
   * @param {boolean} [recursive=false]
   * @returns {Promise<void>}
   */
  async remove(relPath, recursive = false) {
    this.requireRemoveCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = { moduleId: this.moduleId, path: validatedPath, recursive };
    await this.coreBridge.request("STORAGE_REMOVE", payload);
  }
  /**
   * Creates a directory.
   * @param {string} relPath
   * @param {boolean} [recursive=true]
   * @returns {Promise<void>}
   */
  async mkdir(relPath, recursive = true) {
    this.requireWriteCapability();
    const validatedPath = this.validateRelativePath(relPath);
    const payload = { moduleId: this.moduleId, path: validatedPath, recursive };
    await this.coreBridge.request("STORAGE_MKDIR", payload);
  }
  /**
   * Copies a file within the workspace.
   * @param {string} srcRelPath
   * @param {string} destRelPath
   * @returns {Promise<void>}
   */
  async copy(srcRelPath, destRelPath) {
    this.requireReadCapability();
    this.requireWriteCapability();
    const validatedSrc = this.validateRelativePath(srcRelPath);
    const validatedDest = this.validateRelativePath(destRelPath);
    const payload = { moduleId: this.moduleId, srcPath: validatedSrc, destPath: validatedDest };
    await this.coreBridge.request("STORAGE_COPY", payload);
  }
  /**
   * Moves/renames a file within the workspace.
   * @param {string} srcRelPath
   * @param {string} destRelPath
   * @returns {Promise<void>}
   */
  async move(srcRelPath, destRelPath) {
    this.requireWriteCapability();
    const validatedSrc = this.validateRelativePath(srcRelPath);
    const validatedDest = this.validateRelativePath(destRelPath);
    const payload = { moduleId: this.moduleId, srcPath: validatedSrc, destPath: validatedDest };
    await this.coreBridge.request("STORAGE_MOVE", payload);
  }
};

// lib/constants.js
var PLUGIN_PROTOCOL = "wagonbox.plugin.v1";
var SDK_VERSION = "1.1.0";
var DEFAULT_TIMEOUT_MS = 3e4;
var CORE_CAPABILITIES = [
  // Shell & Execution
  "shell.execute",
  // Configuration
  "config.read",
  "config.write",
  // API Management
  "api.register",
  "api.call",
  // Storage (workspace)
  "storage.read",
  "storage.write",
  "storage.list",
  "storage.remove",
  // System Management (per system-architecture.md)
  "system.read",
  "system.manage",
  // Network Management
  "network.read",
  "network.configure",
  // Storage Management (LVM, volumes)
  "storage.configure",
  // User & Access Management
  "user.read",
  "user.manage",
  // File System (system-wide)
  "file.read",
  "file.write",
  // Terminal
  "terminal.execute",
  // License
  "license.read",
  "license.activate",
  // Cluster
  "cluster.read",
  "cluster.manage",
  // Audit
  "audit.read",
  // Module Management
  "modules.read",
  "modules.manage"
];
var MANIFEST_NAME_PATTERN = /^wagonbox-[a-z0-9-]+$/;

// lib/capabilities.js
var CapabilitySet = class _CapabilitySet extends Set {
  static {
    __name(this, "CapabilitySet");
  }
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
    return caps.every((c) => this.has(c));
  }
  /**
   * Check if any capability is present.
   * @param {...CoreCapability} caps
   * @returns {boolean}
   */
  hasAny(...caps) {
    return caps.some((c) => this.has(c));
  }
  /**
   * Add multiple capabilities.
   * @param {...CoreCapability} caps
   * @returns {this}
   */
  addAll(...caps) {
    caps.forEach((c) => this.add(c));
    return this;
  }
  /**
   * Remove multiple capabilities.
   * @param {...CoreCapability} caps
   * @returns {this}
   */
  removeAll(...caps) {
    caps.forEach((c) => this.delete(c));
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
    return new _CapabilitySet(json);
  }
};
var CAPABILITY_GROUPS = {
  shell: ["shell.execute"],
  config: ["config.read", "config.write"],
  api: ["api.register", "api.call"],
  storage: ["storage.read", "storage.write", "storage.list", "storage.remove"],
  system: ["system.read", "system.manage"],
  network: ["network.read", "network.configure"],
  storage_mgmt: ["storage.configure"],
  user: ["user.read", "user.manage"],
  file: ["file.read", "file.write"],
  terminal: ["terminal.execute"],
  license: ["license.read", "license.activate"],
  cluster: ["cluster.read", "cluster.manage"],
  audit: ["audit.read"],
  modules: ["modules.read", "modules.manage"],
  all: CORE_CAPABILITIES
};
function createCapabilitySet(...groups) {
  const caps = new CapabilitySet();
  for (const group of groups) {
    caps.addAll(...CAPABILITY_GROUPS[group]);
  }
  return caps;
}
__name(createCapabilitySet, "createCapabilitySet");
function validateCapabilities(capabilities) {
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
__name(validateCapabilities, "validateCapabilities");
function negotiateCapabilities(requested, granted) {
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
__name(negotiateCapabilities, "negotiateCapabilities");

// lib/network.js
var NetworkGateway = class {
  static {
    __name(this, "NetworkGateway");
  }
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") throw new Error("CoreBridge with request() method is required");
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() {
    if (!this.capabilities.has("network.read")) throw new Error("Capability required: network.read");
  }
  requireConfigure() {
    if (!this.capabilities.has("network.configure")) throw new Error("Capability required: network.configure");
  }
  async interfaces() {
    this.requireRead();
    return this.coreBridge.request("NETWORK_LIST", {});
  }
  async connections() {
    this.requireRead();
    return this.coreBridge.request("NETWORK_CONNECTIONS", {});
  }
  async get(id) {
    this.requireRead();
    if (!id || typeof id !== "string") throw new Error("Connection id must be non-empty string");
    return this.coreBridge.request("NETWORK_GET", { id });
  }
  async configure(input) {
    this.requireConfigure();
    if (!input || typeof input !== "object") throw new Error("Network configure input must be object");
    return this.coreBridge.request("NETWORK_CONFIGURE", { input });
  }
  async up(id) {
    this.requireConfigure();
    if (!id) throw new Error("id required");
    return this.coreBridge.request("NETWORK_UP", { id });
  }
  async down(id) {
    this.requireConfigure();
    if (!id) throw new Error("id required");
    return this.coreBridge.request("NETWORK_DOWN", { id });
  }
};

// lib/hardware.js
var HardwareGateway = class {
  static {
    __name(this, "HardwareGateway");
  }
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") throw new Error("CoreBridge with request() method is required");
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() {
    if (!this.capabilities.has("system.read")) throw new Error("Capability required: system.read");
  }
  async telemetry() {
    this.requireRead();
    return this.coreBridge.request("HARDWARE_TELEMETRY", {});
  }
  async fingerprint() {
    this.requireRead();
    return this.coreBridge.request("HARDWARE_FINGERPRINT", {});
  }
};

// lib/storage-mgmt.js
var StorageMgmtGateway = class {
  static {
    __name(this, "StorageMgmtGateway");
  }
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") throw new Error("CoreBridge with request() method is required");
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() {
    if (!this.capabilities.has("storage.read")) throw new Error("Capability required: storage.read");
  }
  requireConfigure() {
    if (!this.capabilities.has("storage.configure")) throw new Error("Capability required: storage.configure");
  }
  async volumes() {
    this.requireRead();
    return this.coreBridge.request("STORAGE_VOLUMES", {});
  }
  async createVolume(input) {
    this.requireConfigure();
    if (!input || typeof input !== "object") throw new Error("createVolume input must be object");
    return this.coreBridge.request("STORAGE_CREATE_VOLUME", { input });
  }
  async deleteVolume(id) {
    this.requireConfigure();
    if (!id) throw new Error("id required");
    return this.coreBridge.request("STORAGE_DELETE_VOLUME", { id });
  }
  async mount(id, path) {
    this.requireConfigure();
    if (!id || !path) throw new Error("id and path required");
    return this.coreBridge.request("STORAGE_MOUNT", { id, path });
  }
  async unmount(id) {
    this.requireConfigure();
    if (!id) throw new Error("id required");
    return this.coreBridge.request("STORAGE_UNMOUNT", { id });
  }
};

// lib/license.js
var LicenseGateway = class {
  static {
    __name(this, "LicenseGateway");
  }
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") throw new Error("CoreBridge with request() method is required");
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() {
    if (!this.capabilities.has("license.read")) throw new Error("Capability required: license.read");
  }
  requireActivate() {
    if (!this.capabilities.has("license.activate")) throw new Error("Capability required: license.activate");
  }
  async status() {
    this.requireRead();
    return this.coreBridge.request("LICENSE_STATUS", {});
  }
  async activate(serialNumber, owner) {
    this.requireActivate();
    if (!serialNumber || typeof serialNumber !== "string") throw new Error("serialNumber required");
    return this.coreBridge.request("LICENSE_ACTIVATE", { serialNumber, owner });
  }
  async importBundle(bundle) {
    this.requireActivate();
    if (!bundle) throw new Error("bundle required");
    return this.coreBridge.request("LICENSE_IMPORT", { bundle });
  }
  async renew() {
    this.requireActivate();
    return this.coreBridge.request("LICENSE_RENEW", {});
  }
  async rebind(oldActivationId, newHwid) {
    this.requireActivate();
    if (!oldActivationId) throw new Error("oldActivationId required");
    return this.coreBridge.request("LICENSE_REBIND", { oldActivationId, newHwid });
  }
};

// lib/users.js
var UsersGateway = class {
  static {
    __name(this, "UsersGateway");
  }
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") throw new Error("CoreBridge with request() method is required");
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() {
    if (!this.capabilities.has("user.read")) throw new Error("Capability required: user.read");
  }
  requireManage() {
    if (!this.capabilities.has("user.manage")) throw new Error("Capability required: user.manage");
  }
  async list() {
    this.requireRead();
    return this.coreBridge.request("USERS_LIST", {});
  }
  async get(id) {
    this.requireRead();
    if (!id) throw new Error("id required");
    return this.coreBridge.request("USERS_GET", { id });
  }
  async create(input) {
    this.requireManage();
    if (!input || typeof input !== "object") throw new Error("input must be object");
    return this.coreBridge.request("USERS_CREATE", { input });
  }
  async update(id, input) {
    this.requireManage();
    if (!id) throw new Error("id required");
    return this.coreBridge.request("USERS_UPDATE", { id, input });
  }
  async delete(id) {
    this.requireManage();
    if (!id) throw new Error("id required");
    return this.coreBridge.request("USERS_DELETE", { id });
  }
  async sshKeys(id) {
    this.requireRead();
    if (!id) throw new Error("id required");
    return this.coreBridge.request("USERS_SSH_KEYS", { id });
  }
  async addSshKey(id, key) {
    this.requireManage();
    if (!id || !key) throw new Error("id and key required");
    return this.coreBridge.request("USERS_ADD_SSH_KEY", { id, key });
  }
};

// lib/terminal.js
var TerminalGateway = class {
  static {
    __name(this, "TerminalGateway");
  }
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") throw new Error("CoreBridge with request() method is required");
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  require() {
    if (!this.capabilities.has("terminal.execute")) throw new Error("Capability required: terminal.execute");
  }
  async spawn(cols, rows) {
    this.require();
    return this.coreBridge.request("TERMINAL_SPAWN", { cols, rows });
  }
  async resize(handleId, cols, rows) {
    this.require();
    if (!handleId) throw new Error("handleId required");
    return this.coreBridge.request("TERMINAL_RESIZE", { handleId, cols, rows });
  }
  async write(handleId, data) {
    this.require();
    if (!handleId) throw new Error("handleId required");
    return this.coreBridge.request("TERMINAL_WRITE", { handleId, data });
  }
  async close(handleId) {
    this.require();
    if (!handleId) throw new Error("handleId required");
    return this.coreBridge.request("TERMINAL_CLOSE", { handleId });
  }
};

// lib/files.js
var FilesGateway = class {
  static {
    __name(this, "FilesGateway");
  }
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") throw new Error("CoreBridge with request() method is required");
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() {
    if (!this.capabilities.has("file.read")) throw new Error("Capability required: file.read");
  }
  requireWrite() {
    if (!this.capabilities.has("file.write")) throw new Error("Capability required: file.write");
  }
  async read(path) {
    this.requireRead();
    if (!path || typeof path !== "string") throw new Error("path required");
    return this.coreBridge.request("FILES_READ", { path });
  }
  async write(path, data) {
    this.requireWrite();
    if (!path) throw new Error("path required");
    return this.coreBridge.request("FILES_WRITE", { path, data });
  }
  async list(path) {
    this.requireRead();
    return this.coreBridge.request("FILES_LIST", { path: path || "/" });
  }
  async stat(path) {
    this.requireRead();
    if (!path) throw new Error("path required");
    return this.coreBridge.request("FILES_STAT", { path });
  }
  async remove(path) {
    this.requireWrite();
    if (!path) throw new Error("path required");
    return this.coreBridge.request("FILES_REMOVE", { path });
  }
  async mkdir(path) {
    this.requireWrite();
    if (!path) throw new Error("path required");
    return this.coreBridge.request("FILES_MKDIR", { path });
  }
};

// lib/audit.js
var AuditGateway = class {
  static {
    __name(this, "AuditGateway");
  }
  constructor(coreBridge, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== "function") throw new Error("CoreBridge with request() method is required");
    this.coreBridge = coreBridge;
    this.capabilities = capabilities;
  }
  requireRead() {
    if (!this.capabilities.has("audit.read")) throw new Error("Capability required: audit.read");
  }
  async record(entry) {
    this.requireRead();
    if (!entry || typeof entry !== "object") throw new Error("entry must be object");
    return this.coreBridge.request("AUDIT_RECORD", { entry });
  }
  async query(filter) {
    this.requireRead();
    return this.coreBridge.request("AUDIT_QUERY", { filter: filter || {} });
  }
};

// lib/module.js
var WagonboxModule = class {
  static {
    __name(this, "WagonboxModule");
  }
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
      throw new Error("Module context is required");
    }
    if (!context.moduleId) {
      throw new Error("moduleId is required in context");
    }
    if (!context.coreBridge || typeof context.coreBridge.request !== "function") {
      throw new Error("coreBridge with request() method is required in context");
    }
    this.moduleId = context.moduleId;
    this.coreBridge = context.coreBridge;
    if (Array.isArray(context.requestedCapabilities)) {
      const { granted, denied } = negotiateCapabilities(context.requestedCapabilities, context.grantedCapabilities || []);
      this.capabilities = new CapabilitySet(granted);
      this.deniedCapabilities = denied;
      if (denied.length) this.coreBridge.emitEvent?.("module.capabilities.denied", { moduleId: context.moduleId, denied });
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
    this.coreBridge.emitEvent?.("module.init", { moduleId: this.moduleId });
  }
  async onStart() {
    this.coreBridge.emitEvent?.("module.start", { moduleId: this.moduleId });
  }
  async onStop() {
    this.coreBridge.emitEvent?.("module.stop", { moduleId: this.moduleId });
  }
  async onDestroy() {
    this.coreBridge.emitEvent?.("module.destroy", { moduleId: this.moduleId });
  }
  /**
   * Register an API route (convenience method).
   * @param {string} path - Route path (e.g., '/api/v1/modules/test/status')
   * @param {string} handler - Handler method name in the module
   * @param {string[]} [scopes] - Optional OAuth scopes required for access
   * @returns {Promise<void>}
   */
  async registerRoute(path, handler, scopes) {
    this.requireCapability("api.register");
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
    this.requireCapability("api.call");
    return this.coreBridge.request("MODULE_CALL", { targetModule, method, params });
  }
};
function init(context) {
  if (!context) {
    return { ok: false, error: "Context object is required" };
  }
  if (!context.coreBridge || typeof context.coreBridge.request !== "function") {
    return { ok: false, error: "CoreBridge with request() method is required" };
  }
  if (!context.moduleId || typeof context.moduleId !== "string") {
    return { ok: false, error: "moduleId (string) is required in context" };
  }
  if (!Array.isArray(context.grantedCapabilities)) {
    return { ok: false, error: "grantedCapabilities must be an array" };
  }
  return { ok: true, context };
}
__name(init, "init");
function createModule(context) {
  const result = init(context);
  if (!result.ok) {
    return null;
  }
  return new WagonboxModule(result.context);
}
__name(createModule, "createModule");
function defineModule({ createModule: factory, onError }) {
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
__name(defineModule, "defineModule");

// lib/manifest.js
function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") return { valid: false, errors: ["manifest must be object"] };
  if (!MANIFEST_NAME_PATTERN.test(manifest.name || "")) errors.push("name must match wagonbox-<name>");
  if (typeof manifest.version !== "string" || !/^\d+\.\d+\.\d+/.test(manifest.version)) errors.push("version must be semver");
  if (manifest.sdkApi !== PLUGIN_PROTOCOL) errors.push(`sdkApi must be ${PLUGIN_PROTOCOL}`);
  if (typeof manifest.minCoreVersion !== "string" || !manifest.minCoreVersion) errors.push("minCoreVersion required");
  if (typeof manifest.entryPoint !== "string" || !manifest.entryPoint) errors.push("entryPoint required");
  if (typeof manifest.apiNamespace !== "string" || !manifest.apiNamespace) errors.push("apiNamespace required");
  if (!Array.isArray(manifest.requestedCapabilities)) errors.push("requestedCapabilities must be array");
  else {
    const { invalid } = validateCapabilities(manifest.requestedCapabilities);
    if (invalid.length) errors.push(`invalid capabilities: ${invalid.join(",")}`);
  }
  if (manifest.methods && !Array.isArray(manifest.methods)) errors.push("methods must be array");
  return { valid: errors.length === 0, errors };
}
__name(validateManifest, "validateManifest");

// lib/core-bridge.js
import { EventEmitter } from "node:events";
var CoreBridgeBase = class extends EventEmitter {
  static {
    __name(this, "CoreBridgeBase");
  }
  constructor() {
    super();
    this.connected = false;
    this.grantedCapabilities = /* @__PURE__ */ new Set();
  }
  /**
   * @template T
   * @param {string} _event
   * @param {object} _payload
   * @returns {Promise<T>}
   */
  async request(_event, _payload) {
    throw new Error("request() must be implemented by subclass");
  }
  /**
   * @param {string} event
   * @param {Function} listener
   * @returns {this}
   */
  on(event, listener) {
    return super.on(event, listener);
  }
  /**
   * @param {string} event
   * @param {Function} listener
   * @returns {this}
   */
  off(event, listener) {
    return super.off(event, listener);
  }
  /**
   * Emit an event to all listeners (uses EventEmitter.emit).
   * @param {string} event
   * @param {unknown} data
   * @returns {boolean} - true if event had listeners
   */
  emitEvent(event, data) {
    return super.emit(event, data);
  }
  /**
   * Subscribe to event - returns unsubscribe function.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} unsubscribe
   */
  subscribe(event, handler) {
    this.on(event, handler);
    return () => this.off(event, handler);
  }
  /**
   * Unsubscribe helper alias.
   * @param {string} event
   * @param {Function} handler
   */
  unsubscribe(event, handler) {
    this.off(event, handler);
  }
  /**
   * @returns {Promise<void>}
   */
  async connect() {
    this.connected = true;
  }
  /**
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.connected = false;
  }
  /**
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }
  /**
   * @returns {ReadonlySet<CoreCapability>}
   */
  getGrantedCapabilities() {
    return new Set(this.grantedCapabilities);
  }
  /**
   * @param {CoreCapability[]} capabilities
   */
  setGrantedCapabilities(capabilities) {
    this.grantedCapabilities = new Set(capabilities);
  }
};
var MockCoreBridge = class extends CoreBridgeBase {
  static {
    __name(this, "MockCoreBridge");
  }
  /**
   * @param {CoreCapability[]} grantedCapabilities
   */
  constructor(grantedCapabilities = []) {
    super();
    this.setGrantedCapabilities(grantedCapabilities);
    this.handlers = /* @__PURE__ */ new Map();
    this.eventHandlers = /* @__PURE__ */ new Map();
    this.config = {};
    this.setupDefaultHandlers();
  }
  setupDefaultHandlers() {
    this.onRequest("SHELL_EXECUTE", async (_payload) => {
      return { stdout: "", stderr: "", exitCode: 0 };
    });
    this.onRequest("CONFIG_GET", async (_payload) => {
      return this.config[_payload.key] ?? null;
    });
    this.onRequest("CONFIG_SET", async (_payload) => {
      this.config[_payload.key] = _payload.value;
      return { ok: true };
    });
    this.onRequest("CONFIG_GET_ALL", async () => {
      return { ...this.config };
    });
    this.onRequest("API_CALL", async (_payload) => {
      return { status: "ok", data: _payload.data };
    });
    this.onRequest("API_REGISTER", async (_payload) => {
      return { ok: true, route: _payload.route };
    });
    this.onRequest("STORAGE_READ", async (_payload) => {
      return { data: "" };
    });
    this.onRequest("STORAGE_WRITE", async (_payload) => {
      return { ok: true };
    });
    this.onRequest("STORAGE_LIST", async (_payload) => {
      return { entries: [] };
    });
    this.onRequest("STORAGE_EXISTS", async (_payload) => {
      return { exists: false };
    });
    this.onRequest("STORAGE_REMOVE", async (_payload) => {
      return { ok: true };
    });
    this.onRequest("MODULE_CALL", async (_payload) => {
      return { ok: true, targetModule: _payload.targetModule, method: _payload.method, params: _payload.params };
    });
    const ok = /* @__PURE__ */ __name(async () => ({ ok: true }), "ok");
    for (const ev of ["NETWORK_LIST", "NETWORK_CONNECTIONS", "NETWORK_GET", "NETWORK_CONFIGURE", "NETWORK_UP", "NETWORK_DOWN", "HARDWARE_TELEMETRY", "HARDWARE_FINGERPRINT", "STORAGE_VOLUMES", "STORAGE_CREATE_VOLUME", "STORAGE_DELETE_VOLUME", "STORAGE_MOUNT", "STORAGE_UNMOUNT", "LICENSE_STATUS", "LICENSE_ACTIVATE", "LICENSE_IMPORT", "LICENSE_RENEW", "LICENSE_REBIND", "USERS_LIST", "USERS_GET", "USERS_CREATE", "USERS_UPDATE", "USERS_DELETE", "USERS_SSH_KEYS", "USERS_ADD_SSH_KEY", "TERMINAL_SPAWN", "TERMINAL_RESIZE", "TERMINAL_WRITE", "TERMINAL_CLOSE", "FILES_READ", "FILES_WRITE", "FILES_LIST", "FILES_STAT", "FILES_REMOVE", "FILES_MKDIR", "AUDIT_RECORD", "AUDIT_QUERY", "STORAGE_MKDIR", "STORAGE_COPY", "STORAGE_MOVE", "STORAGE_STAT"]) {
      if (!this.handlers.has(ev)) this.onRequest(ev, ok);
    }
  }
  /**
   * Simulate .wbmod verification pipeline for testing (format→compat→sig→entitlement→capability→decrypt).
   * Returns { ok, step, errors }.
   */
  async verifyWbmod(wbmod) {
    const errors = [];
    if (!wbmod || typeof wbmod !== "object") return { ok: false, step: "format", errors: ["invalid wbmod object"] };
    if (!wbmod.manifestName || !wbmod.data || !wbmod.iv || !wbmod.tag) return { ok: false, step: "format", errors: ["missing iv/tag/data/manifestName"] };
    if (wbmod.v !== 1) return { ok: false, step: "compatibility", errors: ["unsupported version"] };
    if (!wbmod.signature) errors.push("missing signature (dev unsigned)");
    return { ok: errors.length === 0, step: errors.length ? "signature" : "decrypt", errors };
  }
  /**
   * @param {string} event
   * @param {Function} handler
   */
  onRequest(event, handler) {
    this.handlers.set(event, handler);
  }
  /**
   * @param {string} event
   * @param {Function} handler
   */
  onEvent(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, /* @__PURE__ */ new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }
  /**
   * @param {string} event
   * @param {Function} handler
   */
  offEvent(event, handler) {
    this.eventHandlers.get(event)?.delete(handler);
  }
  /**
   * @template T
   * @param {string} event
   * @param {object} payload
   * @returns {Promise<T>}
   */
  async request(event, payload) {
    const handler = this.handlers.get(event);
    if (!handler) {
      throw new Error(`No handler for event: ${event}`);
    }
    return handler(payload);
  }
  /**
   * @param {string} event
   * @param {unknown} data
   * @returns {Promise<void>}
   */
  async emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      await Promise.all(Array.from(handlers).map((h) => h(data)));
    }
  }
  /**
   * @param {Record<string, string>} config
   */
  setConfig(config) {
    this.config = { ...config };
  }
  /**
   * @returns {Record<string, string>}
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * @param {string} event
   * @param {unknown} data
   */
  simulateEvent(event, data) {
    this.emit(event, data);
  }
};

// lib/errors.js
var ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID: "AUTH_INVALID",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  CAPABILITY_DENIED: "CAPABILITY_DENIED",
  LICENSE_REQUIRED: "LICENSE_REQUIRED",
  LICENSE_INVALID: "LICENSE_INVALID",
  LICENSE_EXPIRED: "LICENSE_EXPIRED",
  ENTITLEMENT_DENIED: "ENTITLEMENT_DENIED",
  MODULE_INVALID: "MODULE_INVALID",
  MODULE_INCOMPATIBLE: "MODULE_INCOMPATIBLE",
  MODULE_SIGNATURE_INVALID: "MODULE_SIGNATURE_INVALID",
  HWID_MISMATCH: "HWID_MISMATCH",
  STEP_UP_REQUIRED: "STEP_UP_REQUIRED",
  STEP_UP_INVALID: "STEP_UP_INVALID",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR"
};
var WagonboxError = class _WagonboxError extends Error {
  static {
    __name(this, "WagonboxError");
  }
  /**
   * @param {WagonboxErrorDetails} details
   */
  constructor({ code, message, details, statusCode }) {
    super(message);
    this.name = "WagonboxError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode ?? this.defaultStatusCode(code);
    Error.captureStackTrace(this, this.constructor);
  }
  /**
   * @param {string} code
   * @returns {number}
   */
  defaultStatusCode(code) {
    switch (code) {
      case ERROR_CODES.AUTH_REQUIRED:
      case ERROR_CODES.AUTH_INVALID:
      case ERROR_CODES.SESSION_EXPIRED:
        return 401;
      case ERROR_CODES.FORBIDDEN:
      case ERROR_CODES.CAPABILITY_DENIED:
      case ERROR_CODES.ENTITLEMENT_DENIED:
        return 403;
      case ERROR_CODES.LICENSE_REQUIRED:
      case ERROR_CODES.LICENSE_INVALID:
      case ERROR_CODES.LICENSE_EXPIRED:
        return 402;
      case ERROR_CODES.MODULE_INVALID:
      case ERROR_CODES.MODULE_INCOMPATIBLE:
      case ERROR_CODES.MODULE_SIGNATURE_INVALID:
        return 400;
      case ERROR_CODES.HWID_MISMATCH:
        return 409;
      case ERROR_CODES.STEP_UP_REQUIRED:
      case ERROR_CODES.STEP_UP_INVALID:
        return 403;
      case ERROR_CODES.VALIDATION_ERROR:
        return 400;
      case ERROR_CODES.RESOURCE_NOT_FOUND:
        return 404;
      case ERROR_CODES.CONFLICT:
        return 409;
      case ERROR_CODES.RATE_LIMITED:
        return 429;
      case ERROR_CODES.INTERNAL_ERROR:
      default:
        return 500;
    }
  }
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      stack: this.stack
    };
  }
  /**
   * @param {unknown} error
   * @returns {error is WagonboxError}
   */
  static isWagonboxError(error) {
    return error instanceof _WagonboxError;
  }
};
var AuthRequiredError = class extends WagonboxError {
  static {
    __name(this, "AuthRequiredError");
  }
  constructor(message = "Authentication required", details) {
    super({ code: ERROR_CODES.AUTH_REQUIRED, message, details });
    this.name = "AuthRequiredError";
  }
};
var AuthInvalidError = class extends WagonboxError {
  static {
    __name(this, "AuthInvalidError");
  }
  constructor(message = "Invalid authentication credentials", details) {
    super({ code: ERROR_CODES.AUTH_INVALID, message, details });
    this.name = "AuthInvalidError";
  }
};
var SessionExpiredError = class extends WagonboxError {
  static {
    __name(this, "SessionExpiredError");
  }
  constructor(message = "Session expired", details) {
    super({ code: ERROR_CODES.SESSION_EXPIRED, message, details });
    this.name = "SessionExpiredError";
  }
};
var ForbiddenError = class extends WagonboxError {
  static {
    __name(this, "ForbiddenError");
  }
  constructor(message = "Access forbidden", details) {
    super({ code: ERROR_CODES.FORBIDDEN, message, details });
    this.name = "ForbiddenError";
  }
};
var CapabilityDeniedError = class extends WagonboxError {
  static {
    __name(this, "CapabilityDeniedError");
  }
  constructor(capability, details) {
    super({
      code: ERROR_CODES.CAPABILITY_DENIED,
      message: `Capability denied: ${capability}`,
      details: { capability, ...details }
    });
    this.name = "CapabilityDeniedError";
  }
};
var LicenseRequiredError = class extends WagonboxError {
  static {
    __name(this, "LicenseRequiredError");
  }
  constructor(message = "Valid license required", details) {
    super({ code: ERROR_CODES.LICENSE_REQUIRED, message, details });
    this.name = "LicenseRequiredError";
  }
};
var LicenseInvalidError = class extends WagonboxError {
  static {
    __name(this, "LicenseInvalidError");
  }
  constructor(message = "Invalid license", details) {
    super({ code: ERROR_CODES.LICENSE_INVALID, message, details });
    this.name = "LicenseInvalidError";
  }
};
var LicenseExpiredError = class extends WagonboxError {
  static {
    __name(this, "LicenseExpiredError");
  }
  constructor(message = "License expired", details) {
    super({ code: ERROR_CODES.LICENSE_EXPIRED, message, details });
    this.name = "LicenseExpiredError";
  }
};
var EntitlementDeniedError = class extends WagonboxError {
  static {
    __name(this, "EntitlementDeniedError");
  }
  constructor(feature, details) {
    super({
      code: ERROR_CODES.ENTITLEMENT_DENIED,
      message: `Entitlement denied: ${feature}`,
      details: { feature, ...details }
    });
    this.name = "EntitlementDeniedError";
  }
};
var ModuleInvalidError = class extends WagonboxError {
  static {
    __name(this, "ModuleInvalidError");
  }
  constructor(message = "Invalid module", details) {
    super({ code: ERROR_CODES.MODULE_INVALID, message, details });
    this.name = "ModuleInvalidError";
  }
};
var ModuleIncompatibleError = class extends WagonboxError {
  static {
    __name(this, "ModuleIncompatibleError");
  }
  constructor(message = "Module incompatible with core version", details) {
    super({ code: ERROR_CODES.MODULE_INCOMPATIBLE, message, details });
    this.name = "ModuleIncompatibleError";
  }
};
var ModuleSignatureInvalidError = class extends WagonboxError {
  static {
    __name(this, "ModuleSignatureInvalidError");
  }
  constructor(message = "Module signature verification failed", details) {
    super({ code: ERROR_CODES.MODULE_SIGNATURE_INVALID, message, details });
    this.name = "ModuleSignatureInvalidError";
  }
};
var HwidMismatchError = class extends WagonboxError {
  static {
    __name(this, "HwidMismatchError");
  }
  constructor(message = "Hardware fingerprint mismatch", details) {
    super({ code: ERROR_CODES.HWID_MISMATCH, message, details });
    this.name = "HwidMismatchError";
  }
};
var StepUpRequiredError = class extends WagonboxError {
  static {
    __name(this, "StepUpRequiredError");
  }
  constructor(message = "Privilege step-up required", details) {
    super({ code: ERROR_CODES.STEP_UP_REQUIRED, message, details });
    this.name = "StepUpRequiredError";
  }
};
var StepUpInvalidError = class extends WagonboxError {
  static {
    __name(this, "StepUpInvalidError");
  }
  constructor(message = "Invalid or expired step-up grant", details) {
    super({ code: ERROR_CODES.STEP_UP_INVALID, message, details });
    this.name = "StepUpInvalidError";
  }
};
var ValidationError = class extends WagonboxError {
  static {
    __name(this, "ValidationError");
  }
  constructor(message, details) {
    super({ code: ERROR_CODES.VALIDATION_ERROR, message, details });
    this.name = "ValidationError";
  }
};
var ResourceNotFoundError = class extends WagonboxError {
  static {
    __name(this, "ResourceNotFoundError");
  }
  constructor(resource, details) {
    super({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: `Resource not found: ${resource}`,
      details: { resource, ...details }
    });
    this.name = "ResourceNotFoundError";
  }
};
var ConflictError = class extends WagonboxError {
  static {
    __name(this, "ConflictError");
  }
  constructor(message = "Resource conflict", details) {
    super({ code: ERROR_CODES.CONFLICT, message, details });
    this.name = "ConflictError";
  }
};
var RateLimitedError = class extends WagonboxError {
  static {
    __name(this, "RateLimitedError");
  }
  constructor(message = "Rate limit exceeded", details) {
    super({ code: ERROR_CODES.RATE_LIMITED, message, details });
    this.name = "RateLimitedError";
  }
};
var InternalError = class extends WagonboxError {
  static {
    __name(this, "InternalError");
  }
  constructor(message = "Internal server error", details) {
    super({ code: ERROR_CODES.INTERNAL_ERROR, message, details });
    this.name = "InternalError";
  }
};
function createError(code, message, details) {
  return new WagonboxError({ code, message, details });
}
__name(createError, "createError");
function isErrorCode(code) {
  return Object.values(ERROR_CODES).includes(code);
}
__name(isErrorCode, "isErrorCode");
var ERROR_HTTP_STATUS = {
  [ERROR_CODES.AUTH_REQUIRED]: 401,
  [ERROR_CODES.AUTH_INVALID]: 401,
  [ERROR_CODES.SESSION_EXPIRED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.CAPABILITY_DENIED]: 403,
  [ERROR_CODES.LICENSE_REQUIRED]: 402,
  [ERROR_CODES.LICENSE_INVALID]: 402,
  [ERROR_CODES.LICENSE_EXPIRED]: 402,
  [ERROR_CODES.ENTITLEMENT_DENIED]: 403,
  [ERROR_CODES.MODULE_INVALID]: 400,
  [ERROR_CODES.MODULE_INCOMPATIBLE]: 400,
  [ERROR_CODES.MODULE_SIGNATURE_INVALID]: 400,
  [ERROR_CODES.HWID_MISMATCH]: 409,
  [ERROR_CODES.STEP_UP_REQUIRED]: 403,
  [ERROR_CODES.STEP_UP_INVALID]: 403,
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.RATE_LIMITED]: 429,
  [ERROR_CODES.INTERNAL_ERROR]: 500
};
export {
  ApiClient,
  AuditGateway,
  AuthInvalidError,
  AuthRequiredError,
  CAPABILITY_GROUPS,
  CORE_CAPABILITIES,
  CapabilityDeniedError,
  CapabilitySet,
  ConfigGateway,
  ConflictError,
  CoreBridgeBase as CoreBridge,
  DEFAULT_TIMEOUT_MS,
  ERROR_CODES,
  ERROR_HTTP_STATUS,
  EntitlementDeniedError,
  FilesGateway,
  ForbiddenError,
  HardwareGateway,
  HwidMismatchError,
  InternalError,
  LicenseExpiredError,
  LicenseGateway,
  LicenseInvalidError,
  LicenseRequiredError,
  MockCoreBridge,
  ModuleIncompatibleError,
  ModuleInvalidError,
  ModuleSignatureInvalidError,
  NetworkGateway,
  PLUGIN_PROTOCOL,
  RateLimitedError,
  ResourceNotFoundError,
  SDK_VERSION,
  SessionExpiredError,
  ShellGateway,
  StepUpInvalidError,
  StepUpRequiredError,
  StorageGateway,
  StorageMgmtGateway,
  TerminalGateway,
  UsersGateway,
  ValidationError,
  WagonboxError,
  WagonboxModule,
  createCapabilitySet,
  createError,
  createModule,
  defineModule,
  init,
  isErrorCode,
  negotiateCapabilities,
  validateCapabilities,
  validateManifest
};
//# sourceMappingURL=index.js.map
