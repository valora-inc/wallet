import PINChange from './usecases/PINChange'
import PINRequire from './usecases/PINRequire'
import { launchApp } from './utils/retries'
import { quickOnboarding } from './utils/utils'

describe('Given PIN', () => {
  beforeEach(async () => {
    await device.uninstallApp()
    await device.installApp()
    await launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
      // TODO(ACT-1133): remove launchArgs
      launchArgs: { statsigGateOverrides: `use_tab_navigator=true` },
    })
    await quickOnboarding()
  })

  afterAll(async () => {
    await device.uninstallApp()
  })

  describe('When Requiring Pin', PINRequire)
  describe('When Changing Pin', PINChange)
})
