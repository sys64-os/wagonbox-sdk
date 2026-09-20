import { resolve, relative } from 'node:path';

const STORAGE_READ_CAPABILITY = 'storage.read';
const STORAGE_WRITE_CAPABILITY = 'storage.write';
const STORAGE_LIST_CAPABILITY = 'storage.list';
const STORAGE_REMOVE_CAPABILITY = 'storage.remove';

/**
 * Storage Gateway for isolated workspace access.
 */
export class StorageGateway {
  /**
   * @param {{ request: Function }} coreBridge
   * @param {string} moduleId
   * @param {Set<string>} capabilities
   */
  constructor(coreBridge, moduleId, capabilities) {
    if (!coreBridge || typeof coreBridge.request !== 'function') {
      throw new Error('CoreBridge with request() method is required');
    }
    if (!moduleId || typeof moduleId !== 'string') {
      throw new Error('moduleId must be a non-empty string');
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
    if (typeof relPath !== 'string') {
      throw new Error('Path must be a string');
    }
    if (!relPath || relPath.trim() === '') {
      throw new Error('Path cannot be empty');
    }

    let normalized = relPath.trim();

    if (normalized.startsWith('/') || normalized.includes('://')) {
      throw new Error('Absolute paths and URLs not allowed');
    }

    try {
      normalized = decodeURIComponent(normalized);
    } catch {
      // ignore decode errors, path will fail validation later
    }

    if (normalized.includes('..')) {
      throw new Error('Path traversal not allowed (..)');
    }

    normalized = normalized.replace(/^\/+/, '');

    const fullPath = resolve(this.workspacePath, normalized);
    const relativePath = relative(this.workspacePath, fullPath);

    if (relativePath.startsWith('..') || relativePath === '') {
      throw new Error('Path traversal not allowed');
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

    return this.coreBridge.request('STORAGE_READ', payload);
  }

  /**
   * Reads file content as Buffer (for binary files).
   * @param {string} relPath
   * @returns {Promise<Buffer>}
   */
  async readBuffer(relPath) {
    this.requireReadCapability();

    const validatedPath = this.validateRelativePath(relPath);

    const payload = { moduleId: this.moduleId, path: validatedPath, encoding: 'buffer' };

    return this.coreBridge.request('STORAGE_READ', payload);
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
      data: data instanceof Buffer ? data.toString('base64') : data,
      encoding: data instanceof Buffer ? 'base64' : 'utf8',
    };

    await this.coreBridge.request('STORAGE_WRITE', payload);
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
      data,
    };

    await this.coreBridge.request('STORAGE_APPEND', payload);
  }

  /**
   * Lists directory entries in the module's workspace.
   * @param {string} [relPath='.']
   * @returns {Promise<string[]>}
   */
  async list(relPath = '.') {
    this.requireListCapability();

    const validatedPath = this.validateRelativePath(relPath);

    const payload = { moduleId: this.moduleId, path: validatedPath };

    const result = await this.coreBridge.request('STORAGE_LIST', payload);
    return result.entries || [];
  }

  /**
   * Lists directory entries with metadata.
   * @param {string} [relPath='.']
   * @returns {Promise<Array<{ name: string; size: number; mtime: number; isDirectory: boolean }>>}
   */
  async listWithMeta(relPath = '.') {
    this.requireListCapability();

    const validatedPath = this.validateRelativePath(relPath);

    const payload = { moduleId: this.moduleId, path: validatedPath, withMeta: true };

    const result = await this.coreBridge.request('STORAGE_LIST', payload);
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

    const result = await this.coreBridge.request('STORAGE_EXISTS', payload);
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

    return this.coreBridge.request('STORAGE_STAT', payload);
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

    await this.coreBridge.request('STORAGE_REMOVE', payload);
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

    await this.coreBridge.request('STORAGE_MKDIR', payload);
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

    await this.coreBridge.request('STORAGE_COPY', payload);
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

    await this.coreBridge.request('STORAGE_MOVE', payload);
  }
}