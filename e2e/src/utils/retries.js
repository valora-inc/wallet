import { retry } from 'ts-retry-promise'
import { dismissCashInBottomSheet, setLocation } from './utils'

export const launchApp = async (
  launchArgs = {
    newInstance: true,
    permissions: { notifications: 'YES', contacts: 'YES', camera: 'YES' },
    launchArgs: {
      detoxPrintBusyIdleResources: 'YES',
    },
  }
) => {
  await retry(
    async () => {
      try {
        // Set location to Central Park NYC
        await setLocation(40.785091, -73.968285)
        await device.launchApp(launchArgs)
      } catch (error) {
        error.message = `Failed to launch app with error: ${error.message}`
        throw error
      }
    },
    { retries: 5, delay: 10 * 1000, timeout: 30 * 10000 }
  ).then(async () => {
    await device.setURLBlacklist(['.*blockchain-api-dot-celo-mobile-alfajores.*'])
  })
}

export const reloadReactNative = async (dismissBottomSheet = true) => {
  await retry(
    async () => {
      try {
        await device.reloadReactNative()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to reload react native with error', error)
        await launchApp()
      }
    },
    { retries: 5, delay: 10 * 1000, timeout: 30 * 10000 }
  )
  if (dismissBottomSheet) await dismissCashInBottomSheet()
}
