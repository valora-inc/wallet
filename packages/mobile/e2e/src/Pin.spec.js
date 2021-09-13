import PINChange from './usecases/PINChange'
import PINRequire from './usecases/PINRequire'
import { launchApp } from './utils/retries'
import { quickOnboarding, setUrlDenyList } from './utils/utils'

describe('Given PIN', () => {
  beforeEach(async () => {
    await device.uninstallApp()
    await device.installApp()
    await launchApp({
      newInstance: false,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await setUrlDenyList()
    await quickOnboarding()
  })

  afterAll(async () => {
    await device.uninstallApp()
  })

  describe('When Requiring Pin', PINRequire)
  describe('When Changing Pin', PINChange)
})
