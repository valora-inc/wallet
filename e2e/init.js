import { launchApp } from './src/utils/retries'

beforeAll(async () => {
  // Install app if not present
  await device.installApp()
  await launchApp({
    newInstance: false,
    permissions: { notifications: 'YES', contacts: 'YES', camera: 'YES' },
  })
  const snapshotFileExists = await device.executeShellCommand(
    'adb shell ls /system/etc/security/cacerts/8794b4e3.0'
  )
  expect(snapshotFileExists).toContain('8794b4e3.0')
})
