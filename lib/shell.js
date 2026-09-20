import { Readable, Writable } from 'node:stream';

const SHELL_EXECUTE_CAPABILITY = 'shell.execute';

/**
 * @typedef {object} ShellExecuteOptions
 * @property {boolean} [requireSudo]
 * @property {string} [userSession]
 * @property {number} [timeout]
 * @property {string} [cwd]
 * @property {Record<string, string>} [env]
 */

/**
 * @typedef {object} ShellExecuteResult
 * @property {string} stdout
 * @property {string} stderr
 * @property {number} exitCode
 * @property {number} [pid]
 */

/**
 * @typedef {object} ShellSpawnHandle
 * @property {number} pid
 * @property {Readable} stdout
 * @property {Readable} stderr
 * @property {Writable} stdin
 * @property {function(): Promise<ShellExecuteResult>} wait
 * @property {function(NodeJS.Signals=): void} kill
 */

class ShellSpawnHandleInternal {
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
      read() {},
      destroy() { this.destroyed = true; },
    });

    this.stderr = new Readable({
      read() {},
      destroy() { this.destroyed = true; },
    });

    this.stdin = new Writable({
      write: (chunk, encoding, callback) => {
        this.sendStdin(chunk).then(() => callback()).catch(callback);
      },
      final: (callback) => {
        this.closeStdin().then(() => callback()).catch(callback);
      },
    });
    this.stdin.destroy = this.destroy.bind(this);

    this.closed = false;
    this.waitPromise = null;
  }

  async sendStdin(chunk) {
    if (this.closed) throw new Error('Process already closed');
    await this.coreBridge.request('SHELL_STDIN', {
      requestId: this.requestId,
      data: chunk.toString(),
    });
  }

  async closeStdin() {
    if (this.closed) return;
    await this.coreBridge.request('SHELL_STDIN_CLOSE', { requestId: this.requestId });
  }

  async wait() {
    if (this.waitPromise) return this.waitPromise;

    this.waitPromise = (async () => {
      const result = await this.coreBridge.request('SHELL_WAIT', { requestId: this.requestId });
      this.close();
      return result;
    })();

    return this.waitPromise;
  }

  kill(signal = 'SIGTERM') {
    if (this.closed) return;
    this.coreBridge.request('SHELL_SIGNAL', {
      requestId: this.requestId,
      signal,
    }).catch(() => {});
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
}

/**
 * Shell Gateway for secure command execution via Core Engine.
 */
export class ShellGateway {
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

  requireCapability() {
    if (!this.capabilities.has(SHELL_EXECUTE_CAPABILITY)) {
      throw new Error(`Capability required: ${SHELL_EXECUTE_CAPABILITY}`);
    }
  }

  validateCommand(command) {
    if (typeof command !== 'string' || !command.trim()) {
      throw new Error('Command must be a non-empty string');
    }
    return command.trim();
  }

  validateArgs(args) {
    if (args === undefined || args === null) {
      return [];
    }
    if (!Array.isArray(args)) {
      throw new Error('Command arguments must be an array of strings (Anti-Injection parameterization)');
    }
    return args.map(arg => String(arg));
  }

  validateOptions(options) {
    if (options === undefined || options === null) {
      return {};
    }
    if (typeof options !== 'object') {
      throw new Error('Options must be an object');
    }
    const opts = options;
    return {
      requireSudo: Boolean(opts.requireSudo),
      userSession: opts.userSession ? String(opts.userSession) : undefined,
      timeout: typeof opts.timeout === 'number' && opts.timeout > 0 ? opts.timeout : 30000,
      cwd: opts.cwd ? String(opts.cwd) : undefined,
      env: opts.env && typeof opts.env === 'object' ? opts.env : undefined,
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
      env: validatedOptions.env,
    };

    return this.coreBridge.request('SHELL_EXECUTE', payload);
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
      spawn: true,
    };

    const result = await this.coreBridge.request('SHELL_SPAWN', payload);
    return new ShellSpawnHandleInternal(this.coreBridge, result.requestId, result.pid);
  }
}