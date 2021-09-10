const detox = require('detox')
import { setDemoMode, setUrlDenyList } from './src/utils/utils'
import { launchApp } from './src/utils/retries'

beforeAll(async () => {
  // This is a hack to ensure android app state stays correct. Causes the app to reinstall for every spec
  if (device.getPlatform() === 'android') {
    await device.uninstallApp()
  }
  // Install app if not present
  await device.installApp()
  await launchApp({
    newInstance: false,
    permissions: { notifications: 'YES', contacts: 'YES' },
  })
  // Url blacklist disables detox waiting for this request to complete before considering the app in an idle state
  await setUrlDenyList()
  await setDemoMode()
})
