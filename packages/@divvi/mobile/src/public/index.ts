/**
 * Public API exports for the mobile library.
 * We use explicit exports instead of 'export *' to:
 * - Maintain a clear and intentional public API surface
 * - Enable better tree-shaking
 * - Prevent accidental exposure of internal implementation details
 */
export { createApp } from './createApp'
export { useWallet } from './hooks/useWallet'
export { type PublicAppConfig } from './types'
