const detox = require('detox')
import { setDemoMode } from './src/utils/utils'
import { launchApp } from './src/utils/retries'

beforeAll(async () => {
  // Install app if not present
  await device.installApp()
  await launchApp({
    newInstance: false,
    permissions: { notifications: 'YES', contacts: 'YES' },
  })
  // Uses demo mode to set a consistent top bar
  await setDemoMode()
})
