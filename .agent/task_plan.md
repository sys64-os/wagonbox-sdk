# WagonBox SDK Alignment Task Plan

**Objective**: Align `@wagonbox/sdk` with `blueprint.md`, `system-architecture.md`, `sdk.md`, `api.md`, `license.md`, `security.md`

**Baseline Commit**: `1526efb` (initial commit)

---

## 📋 Gap Analysis Summary

| Category | Blueprint Requirement | Current Status | Priority |
|----------|----------------------|----------------|----------|
| CoreBridge Events | Event subscription via CoreBridge | ❌ Missing `subscribe`/`unsubscribe` | P0 |
| Network API | `interfaces()`, `connections()`, `configure()` | ❌ Missing entirely | P0 |
| Hardware API | `telemetry()`, `fingerprint()` | ❌ Missing entirely | P0 |
| Storage Management API | `volumes()`, `createVolume()` | ❌ Only workspace ops | P0 |
| License API | `status()`, `activate()`, `import()` | ❌ Missing entirely | P0 |
| User Management API | `list()`, `create()`, `update()` | ❌ Missing entirely | P0 |
| Terminal API | PTY stream handling | ❌ Missing entirely | P0 |
| Audit API | `record()` | ❌ Missing entirely | P0 |
| File API | `read()`, `write()` (beyond workspace) | ❌ Only workspace | P1 |
| Capability Expansion | 18+ capabilities (system-arch §3) | ⚠️ Only 8 implemented | P1 |
| Structured Errors | `CAPABILITY_DENIED`, `LICENSE_REQUIRED`, etc. | ❌ Generic Errors only | P1 |
| CoreBridge.emit() Bug | Recursive call on line 63 | ❌ Bug exists | P0 |
| .wbmod Pipeline | AES-256-GCM + ECDSA sign | ⚠️ Script only, no crypto | P2 |
| Module-to-Module Call | `MODULE_CALL` handler | ❌ Missing in MockCoreBridge | P2 |

---

## 🎯 Task Plan

### Phase 1: Critical Bug Fixes & Foundation (Week 1)

#### TASK-001: Fix CoreBridge.emit() Recursion Bug
- **File**: `lib/core-bridge.js:63`
- **Issue**: `this.emit(event, data)` calls itself recursively
- **Fix**: Rename method to `emitEvent` or use `super.emit()`
- **Test**: Verify event emission works in `MockCoreBridge`

#### TASK-002: Implement Structured Error Classes
- **File**: `lib/errors.js` (new)
- **Error Codes** (per api.md §39):
  - `AUTH_REQUIRED`, `AUTH_INVALID`, `SESSION_EXPIRED`
  - `FORBIDDEN`, `CAPABILITY_DENIED`
  - `LICENSE_REQUIRED`, `LICENSE_INVALID`, `LICENSE_EXPIRED`, `ENTITLEMENT_DENIED`
  - `MODULE_INVALID`, `MODULE_INCOMPATIBLE`, `MODULE_SIGNATURE_INVALID`
  - `HWID_MISMATCH`, `STEP_UP_REQUIRED`, `STEP_UP_INVALID`
  - `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `CONFLICT`
  - `RATE_LIMITED`, `INTERNAL_ERROR`
- **Export**: `WagonboxError` class with `code` + `details`

#### TASK-003: Expand CORE_CAPABILITIES to Match Blueprint
- **File**: `lib/constants.js`
- **Add capabilities** (system-architecture.md §3, sdk.md §14):
  ```javascript
  'system.read', 'system.manage',
  'network.read', 'network.configure',
  'storage.read', 'storage.configure',
  'user.read', 'user.manage',
  'file.read', 'file.write',
  'terminal.execute',
  'license.read', 'license.activate',
  'cluster.read', 'cluster.manage',
  'audit.read',
  'modules.read', 'modules.manage'
  ```
- **Update**: `CAPABILITY_GROUPS` in `lib/capabilities.js`

---

### Phase 2: Core Gateway APIs (Week 2-3)

#### TASK-004: Network Gateway (`lib/network.js` + export in `index.js`)
- **Methods**:
  - `interfaces()` → `network.read`
  - `connections()` → `network.read`
  - `configure(input)` → `network.configure`
  - `up(id)`, `down(id)` → `network.configure`
- **CoreBridge Events**: `NETWORK_LIST`, `NETWORK_GET`, `NETWORK_CONFIGURE`

#### TASK-005: Hardware Gateway (`lib/hardware.js`)
- **Methods**:
  - `telemetry()` → `hardware.read`
  - `fingerprint()` → `hardware.read` (returns HWID object)
- **CoreBridge Events**: `HARDWARE_TELEMETRY`, `HARDWARE_FINGERPRINT`

#### TASK-006: Storage Management Gateway (`lib/storage-management.js`)
- **Methods** (beyond workspace):
  - `volumes()` → `storage.read`
  - `createVolume(input)` → `storage.configure`
  - `deleteVolume(id)` → `storage.configure`
  - `mount(id, path)` → `storage.configure`
  - `unmount(id)` → `storage.configure`
- **CoreBridge Events**: `STORAGE_VOLUMES`, `STORAGE_CREATE_VOLUME`, etc.

#### TASK-007: License Gateway (`lib/license.js`)
- **Methods** (per license.md):
  - `status()` → `license.read`
  - `activate(serialNumber, owner)` → `license.activate`
  - `import(bundle)` → `license.activate` (air-gapped)
  - `renew()` → `license.activate`
  - `rebind(oldActivationId, newHwid)` → `license.activate`
- **CoreBridge Events**: `LICENSE_STATUS`, `LICENSE_ACTIVATE`, `LICENSE_IMPORT`, `LICENSE_RENEW`, `LICENSE_REBIND`

#### TASK-008: User Management Gateway (`lib/users.js`)
- **Methods**:
  - `list()` → `user.read`
  - `get(id)` → `user.read`
  - `create(input)` → `user.manage`
  - `update(id, input)` → `user.manage`
  - `delete(id)` → `user.manage`
  - `setPassword(id, password)` → `user.manage` (requires step-up)
  - `sshKeys(id)` → `user.read`
  - `addSshKey(id, key)` → `user.manage`
- **CoreBridge Events**: `USERS_LIST`, `USERS_GET`, `USERS_CREATE`, etc.

#### TASK-009: Terminal Gateway (`lib/terminal.js`)
- **Methods**:
  - `spawn(cols, rows)` → `terminal.execute` (returns PTY handle)
  - `resize(handleId, cols, rows)` → `terminal.execute`
  - `write(handleId, data)` → `terminal.execute`
  - `close(handleId)` → `terminal.execute`
- **CoreBridge Events**: `TERMINAL_SPAWN`, `TERMINAL_RESIZE`, `TERMINAL_WRITE`, `TERMINAL_CLOSE`
- **Streams**: Handle stdin/stdout/stderr via event streaming

#### TASK-010: File Gateway (`lib/files.js`) - Beyond Workspace
- **Methods** (system-wide, requires `file.read`/`file.write`):
  - `read(path)` → `file.read` (absolute paths allowed)
  - `write(path, data)` → `file.write`
  - `list(path)` → `file.read`
  - `stat(path)` → `file.read`
  - `remove(path)` → `file.write`
  - `mkdir(path)` → `file.write`
- **Security**: Core validates path via jail/allowlist (not SDK)

#### TASK-011: Audit Gateway (`lib/audit.js`)
- **Methods**:
  - `record(entry)` → `audit.read` (Core records authoritative audit)
  - `query(filter)` → `audit.read`
- **CoreBridge Events**: `AUDIT_RECORD`, `AUDIT_QUERY`

---

### Phase 3: Event System & Module Communication (Week 3)

#### TASK-012: CoreBridge Event Subscription API
- **Add to `CoreBridgeBase`**:
  - `subscribe(event, handler)` → returns `unsubscribe()`
  - `unsubscribe(event, handler)`
- **Update `MockCoreBridge`** with event handler registry
- **Add to `ApiClient`**: `subscribe(event, handler)`, `unsubscribe()`

#### TASK-013: Module-to-Module Communication
- **Add `MODULE_CALL` handler** in `MockCoreBridge`
- **Add to `WagonboxModule`**: `callModule(targetModule, method, params)` (already exists, needs bridge support)
- **Capability**: `api.call` (already in list)

---

### Phase 4: Module Lifecycle & Initialization (Week 4)

#### TASK-014: Capability Negotiation in Module Init
- **Modify `WagonboxModule` constructor**:
  - Use `negotiateCapabilities(requested, granted)` from `capabilities.js`
  - Store `denied` capabilities for logging
  - Emit event if capabilities denied
- **Update `init()`** to return negotiated capabilities

#### TASK-015: Module Lifecycle Events
- **CoreBridge Events**: `MODULE_INIT`, `MODULE_START`, `MODULE_STOP`, `MODULE_DESTROY`
- **Add to `WagonboxModule`**: Auto-emit lifecycle events

#### TASK-016: Manifest Validation
- **Add `lib/manifest.js`**: Validate manifest.json against schema
- **Check**: `name` pattern, `version` semver, `sdkApi` = `wagonbox.plugin.v1`, `entryPoint` exists, `requestedCapabilities` valid
- **Export**: `validateManifest(manifest)`

---

### Phase 5: .wbmod Packaging Pipeline (Week 4-5)

#### TASK-017: Implement .wbmod Build Crypto
- **File**: `scripts/build-wbmod.mjs` (replace `.sh`)
- **Pipeline** (per build-flow.md §27):
  1. Bundle frontend (Vite/esbuild)
  2. Bundle backend → `.jsc` (Bytenode) if applicable
  3. Create `manifest.json` + assets
  4. **AES-256-GCM encrypt** payload
  5. **ECDSA P-256 sign** encrypted payload
  6. Output `.wbmod`
- **Keys**: Use dev keys from `.env` (separate from production)

#### TASK-018: Module Loader Verification (for testing)
- **Add to `MockCoreBridge`**: Simulate `.wbmod` verification flow
  - Format validation
  - Compatibility check
  - Signature verification
  - License entitlement check
  - Capability policy check
  - Decrypt in memory

---

### Phase 6: Testing & Documentation (Week 5)

#### TASK-019: Integration Tests for New Gateways
- **Each gateway**: Unit tests mirroring `security-pentest.test.js` patterns
- **Test capability enforcement**, input validation, error codes

#### TASK-020: Update TypeScript Definitions
- **File**: `types/index.d.ts`
- Add types for all new gateways, events, error classes

#### TASK-021: Update Documentation
- **Files**: `docs/04-gateways-reference.md`, `docs/03-capabilities-security.md`
- Document new capabilities, gateways, event system

---

## 📦 Deliverables Checklist

| Deliverable | Target |
|-------------|--------|
| `lib/errors.js` | Phase 1 |
| `lib/network.js` | Phase 2 |
| `lib/hardware.js` | Phase 2 |
| `lib/storage-management.js` | Phase 2 |
| `lib/license.js` | Phase 2 |
| `lib/users.js` | Phase 2 |
| `lib/terminal.js` | Phase 2 |
| `lib/files.js` | Phase 2 |
| `lib/audit.js` | Phase 2 |
| `lib/manifest.js` | Phase 4 |
| `scripts/build-wbmod.mjs` | Phase 5 |
| Updated `types/index.d.ts` | Phase 6 |
| Updated docs | Phase 6 |
| All unit tests passing | Phase 6 |

---

## 🔗 Dependencies

```mermaid
TASK-001 → TASK-012 (CoreBridge fix needed for events)
TASK-002 → TASK-004..TASK-011 (Error classes used by all gateways)
TASK-003 → TASK-004..TASK-011 (Capabilities needed for new gateways)
TASK-012 → TASK-009 (Terminal needs event streaming)
TASK-014 → TASK-015 (Lifecycle needs capability negotiation)
TASK-017 → TASK-018 (Build pipeline feeds loader verification)
```

---

## ✅ Acceptance Criteria (Per sdk.md §84)

- [ ] `@wagonbox/sdk` package identity correct
- [ ] CoreBridge is primary in-process boundary
- [ ] CoreBridge differentiated from UDS
- [ ] Core remains authority
- [ ] Manifest capabilities = declarations, not grants
- [ ] Core does runtime capability enforcement
- [ ] License entitlement checked by Core
- [ ] Route registration via Core
- [ ] WebSocket/event access via Core
- [ ] Module storage namespaced
- [ ] No raw SQLCipher connection
- [ ] File access via Core-controlled API
- [ ] Command execution = structured command + args
- [ ] Module never receives root password
- [ ] Privileged ops support step-up
- [ ] Audit by Core
- [ ] Secrets not in logs
- [ ] Module lifecycle supports graceful shutdown
- [ ] SDK/Core compatibility verified
- [ ] V8 bytecode not considered sandbox
- [ ] No unrestricted Node.js privileges
- [ ] Module-to-module via Core boundary
- [ ] `.wbmod` verified before execution
- [ ] No persistent source extraction
- [ ] Structured errors available
- [ ] Timeout/cancellation for long-running ops
- [ ] Integration tests verify capability + lifecycle
- [ ] Public SDK contract documented

---

## 🚀 Quick Start Commands

```bash
# Run tests
npm test

# Build SDK
npm run build

# Lint
npm run lint

# Check types
npx tsc --noEmit
```

---

## 📝 Notes

- **Branch Strategy**: Each task on `feat/task-XXX` branch, PR to `main`
- **Backwards Compatibility**: All new APIs additive; existing APIs unchanged
- **Security First**: Every new gateway must have capability checks + input validation + security tests
- **MockCoreBridge**: Must implement all CoreBridge events for testing