import * as AppConfigModule from './appConfig'
import { PublicAppConfig } from './public/types'

describe('appConfig', () => {
  let getAppConfig: typeof AppConfigModule.getAppConfig
  let setAppConfig: typeof AppConfigModule.setAppConfig

  beforeEach(() => {
    // Reset the module between tests to clear the appConfig
    jest.resetModules()
    // Re-import the functions after reset
    const newAppConfigModule = require('./appConfig')
    setAppConfig = newAppConfigModule.setAppConfig
    getAppConfig = newAppConfigModule.getAppConfig
  })

  const mockConfig: PublicAppConfig = {
    registryName: 'MyApp',
    displayName: 'MyApp',
    deepLinkUrlScheme: 'myapp',
  }

  it('should set and get app config correctly', () => {
    setAppConfig(mockConfig)
    const retrievedConfig = getAppConfig()
    expect(retrievedConfig).toEqual(mockConfig)
  })

  it('should throw when setting config multiple times', () => {
    setAppConfig(mockConfig)
    expect(() => setAppConfig(mockConfig)).toThrow('App config already set')
  })

  it('should throw when getting config before setting it', () => {
    expect(() => getAppConfig()).toThrow('App config not set')
  })
})
