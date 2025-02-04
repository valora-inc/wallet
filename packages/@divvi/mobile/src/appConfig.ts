// IMPORTANT: This file should not import any other runtime files, to avoid circular dependencies
import { PublicAppConfig } from './public/types'

let appConfig: PublicAppConfig | undefined

export function setAppConfig(config: PublicAppConfig) {
  if (appConfig) {
    throw new Error('App config already set')
  }
  appConfig = config
}

export function getAppConfig(): PublicAppConfig {
  if (!appConfig) {
    // If this happens, something is wrong in the initialization of the runtime
    // Either some code tried to access the config before it was set, or the config was not set at all
    throw new Error('App config not set')
  }
  return appConfig
}
