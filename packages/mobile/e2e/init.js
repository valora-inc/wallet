const detox = require('detox')
import { setDemoMode } from './src/utils/utils'

beforeAll(async () => {
  await device.launchApp({
    newInstance: false,
    permissions: { notifications: 'YES', contacts: 'YES' },
    detoxURLBlacklistRegex: '("https://blockchain-api-dot-celo-mobile-alfajores.appspot.com(.*)")',
  })
  await setDemoMode()
})
