const detox = require('detox')
import { setDemoMode } from './src/utils/utils'

beforeAll(async () => {
  // Install app if not present
  await device.installApp()
  await device.launchApp({
    newInstance: false,
    permissions: { notifications: 'YES', contacts: 'YES' },
  })
  // Disabled url blacklist while test take longer this results in less flakey tests in CI
  // await device.setURLBlacklist(['.*blockchain-api-dot-celo-mobile-alfajores.appspot.com.*'])
  await setDemoMode()
})
