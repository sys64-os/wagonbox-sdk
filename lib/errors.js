/**
 * WagonBox SDK - Structured Error Classes
 * Error codes per api.md §39
 */

export const ERROR_CODES = {
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
};

/**
 * @typedef {Object} WagonboxErrorDetails
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {unknown} [details] - Additional error details
 * @property {number} [statusCode] - HTTP status code
 */

/**
 * Base error class for all WagonBox SDK errors.
 */
export class WagonboxError extends Error {
  /**
   * @param {WagonboxErrorDetails} details
   */
  constructor({ code, message, details, statusCode }) {
    super(message);
    this.name = 'WagonboxError';
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
      stack: this.stack,
    };
  }

  /**
   * @param {unknown} error
   * @returns {error is WagonboxError}
   */
  static isWagonboxError(error) {
    return error instanceof WagonboxError;
  }
}

export class AuthRequiredError extends WagonboxError {
  constructor(message = 'Authentication required', details) {
    super({ code: ERROR_CODES.AUTH_REQUIRED, message, details });
    this.name = 'AuthRequiredError';
  }
}

export class AuthInvalidError extends WagonboxError {
  constructor(message = 'Invalid authentication credentials', details) {
    super({ code: ERROR_CODES.AUTH_INVALID, message, details });
    this.name = 'AuthInvalidError';
  }
}

export class SessionExpiredError extends WagonboxError {
  constructor(message = 'Session expired', details) {
    super({ code: ERROR_CODES.SESSION_EXPIRED, message, details });
    this.name = 'SessionExpiredError';
  }
}

export class ForbiddenError extends WagonboxError {
  constructor(message = 'Access forbidden', details) {
    super({ code: ERROR_CODES.FORBIDDEN, message, details });
    this.name = 'ForbiddenError';
  }
}

export class CapabilityDeniedError extends WagonboxError {
  constructor(capability, details) {
    super({
      code: ERROR_CODES.CAPABILITY_DENIED,
      message: `Capability denied: ${capability}`,
      details: { capability, ...details },
    });
    this.name = 'CapabilityDeniedError';
  }
}

export class LicenseRequiredError extends WagonboxError {
  constructor(message = 'Valid license required', details) {
    super({ code: ERROR_CODES.LICENSE_REQUIRED, message, details });
    this.name = 'LicenseRequiredError';
  }
}

export class LicenseInvalidError extends WagonboxError {
  constructor(message = 'Invalid license', details) {
    super({ code: ERROR_CODES.LICENSE_INVALID, message, details });
    this.name = 'LicenseInvalidError';
  }
}

export class LicenseExpiredError extends WagonboxError {
  constructor(message = 'License expired', details) {
    super({ code: ERROR_CODES.LICENSE_EXPIRED, message, details });
    this.name = 'LicenseExpiredError';
  }
}

export class EntitlementDeniedError extends WagonboxError {
  constructor(feature, details) {
    super({
      code: ERROR_CODES.ENTITLEMENT_DENIED,
      message: `Entitlement denied: ${feature}`,
      details: { feature, ...details },
    });
    this.name = 'EntitlementDeniedError';
  }
}

export class ModuleInvalidError extends WagonboxError {
  constructor(message = 'Invalid module', details) {
    super({ code: ERROR_CODES.MODULE_INVALID, message, details });
    this.name = 'ModuleInvalidError';
  }
}

export class ModuleIncompatibleError extends WagonboxError {
  constructor(message = 'Module incompatible with core version', details) {
    super({ code: ERROR_CODES.MODULE_INCOMPATIBLE, message, details });
    this.name = 'ModuleIncompatibleError';
  }
}

export class ModuleSignatureInvalidError extends WagonboxError {
  constructor(message = 'Module signature verification failed', details) {
    super({ code: ERROR_CODES.MODULE_SIGNATURE_INVALID, message, details });
    this.name = 'ModuleSignatureInvalidError';
  }
}

export class HwidMismatchError extends WagonboxError {
  constructor(message = 'Hardware fingerprint mismatch', details) {
    super({ code: ERROR_CODES.HWID_MISMATCH, message, details });
    this.name = 'HwidMismatchError';
  }
}

export class StepUpRequiredError extends WagonboxError {
  constructor(message = 'Privilege step-up required', details) {
    super({ code: ERROR_CODES.STEP_UP_REQUIRED, message, details });
    this.name = 'StepUpRequiredError';
  }
}

export class StepUpInvalidError extends WagonboxError {
  constructor(message = 'Invalid or expired step-up grant', details) {
    super({ code: ERROR_CODES.STEP_UP_INVALID, message, details });
    this.name = 'StepUpInvalidError';
  }
}

export class ValidationError extends WagonboxError {
  constructor(message, details) {
    super({ code: ERROR_CODES.VALIDATION_ERROR, message, details });
    this.name = 'ValidationError';
  }
}

export class ResourceNotFoundError extends WagonboxError {
  constructor(resource, details) {
    super({
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: `Resource not found: ${resource}`,
      details: { resource, ...details },
    });
    this.name = 'ResourceNotFoundError';
  }
}

export class ConflictError extends WagonboxError {
  constructor(message = 'Resource conflict', details) {
    super({ code: ERROR_CODES.CONFLICT, message, details });
    this.name = 'ConflictError';
  }
}

export class RateLimitedError extends WagonboxError {
  constructor(message = 'Rate limit exceeded', details) {
    super({ code: ERROR_CODES.RATE_LIMITED, message, details });
    this.name = 'RateLimitedError';
  }
}

export class InternalError extends WagonboxError {
  constructor(message = 'Internal server error', details) {
    super({ code: ERROR_CODES.INTERNAL_ERROR, message, details });
    this.name = 'InternalError';
  }
}

/**
 * Create a WagonboxError with the given code.
 * @param {string} code
 * @param {string} message
 * @param {unknown} [details]
 * @returns {WagonboxError}
 */
export function createError(code, message, details) {
  return new WagonboxError({ code, message, details });
}

/**
 * Check if a string is a valid error code.
 * @param {string} code
 * @returns {boolean}
 */
export function isErrorCode(code) {
  return Object.values(ERROR_CODES).includes(code);
}

/**
 * HTTP status codes for each error code.
 * @type {Object.<string, number>}
 */
export const ERROR_HTTP_STATUS = {
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
  [ERROR_CODES.INTERNAL_ERROR]: 500,
};