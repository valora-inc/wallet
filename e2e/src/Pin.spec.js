import PINChange from './usecases/PINChange'
import PINRequire from './usecases/PINRequire'
import { launchApp } from './utils/retries'
import { quickOnboarding } from './utils/utils'

describe.each([{ navType: 'drawer' }, { navType: 'tab' }])(
  'Given PIN (Navigation type: $navType)',
  ({ navType }) => {
    beforeEach(async () => {
      await device.uninstallApp()
      await device.installApp()
      await launchApp({
        newInstance: false,
        permissions: { notifications: 'YES', contacts: 'YES' },
        launchArgs: { statsigGateOverrides: `use_tab_navigator=${navType === 'tab'}` },
      })
      await quickOnboarding()
    })

    afterAll(async () => {
      await device.uninstallApp()
    })

    describe('When Requiring Pin', PINRequire(navType))
    describe('When Changing Pin', PINChange(navType))
  }
)
