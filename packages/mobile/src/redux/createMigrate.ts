// Adapted from https://github.com/rt2zz/redux-persist/blob/d7efde9115a0bd2d6a0309ac6fb1c018bf06dc30/src/createMigrate.js
// so we can enable logging in production
import type { MigrationManifest, PersistedState } from 'redux-persist'
import { DEFAULT_VERSION } from 'redux-persist/es/constants'
import Logger from 'src/utils/Logger'

const TAG = 'redux/migrate'

export function createMigrate(migrations: MigrationManifest) {
  return async (state: PersistedState, currentVersion: number): Promise<PersistedState> => {
    try {
      if (!state) {
        Logger.info(TAG, 'no inbound state, skipping migration')
        return undefined
      }

      const inboundVersion: number =
        state._persist && state._persist.version !== undefined
          ? state._persist.version
          : DEFAULT_VERSION
      if (inboundVersion === currentVersion) {
        Logger.info(TAG, 'versions match, noop migration')
        return state
      }
      if (inboundVersion > currentVersion) {
        Logger.error(TAG, 'downgrading version is not supported')
        return state
      }

      const migrationKeys = Object.keys(migrations)
        .map((ver) => parseInt(ver, 10))
        .filter((key) => currentVersion >= key && key > inboundVersion)
        .sort((a, b) => a - b)

      Logger.info(TAG, 'migrationKeys', migrationKeys)
      const migratedState = migrationKeys.reduce<PersistedState>((currentState, versionKey) => {
        Logger.info(TAG, 'running migration for versionKey', versionKey)
        return migrations[versionKey](currentState)
      }, state)
      return migratedState
    } catch (err) {
      Logger.error(TAG, 'Failed to migrate state', err)
      throw err
    }
  }
}
