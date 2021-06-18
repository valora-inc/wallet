import { setDemoMode } from './src/utils/utils'

beforeAll(async () => {
  await device.launchApp({
    permissions: { notifications: 'YES', contacts: 'YES' },
  })
})

beforeEach(async () => {
  await setDemoMode()
})
