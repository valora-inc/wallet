import { merge } from 'lodash'
import { retry } from 'ts-retry-promise'

const defaultLaunchArgs = {
  newInstance: true,
  permissions: { notifications: 'YES', contacts: 'YES', camera: 'YES' },
  launchArgs: {
    detoxPrintBusyIdleResources: 'YES',
  },
}

export const launchApp = async (customArgs = {}) => {
  // Deep merge customArgs into defaultLaunchArgs
  const launchArgs = merge({}, defaultLaunchArgs, customArgs)

  await retry(
    async () => {
      try {
        await device.launchApp(launchArgs)
      } catch (error) {
        error.message = `Failed to launch app with error: ${error.message}`
        throw error
      }
    },
    { retries: 5, delay: 10 * 1000, timeout: 30 * 10000 }
  )
}

export const reloadReactNative = async () => {
  await retry(
    async () => {
      try {
        await device.reloadReactNative()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to reload react native with error', error)
        await launchApp(defaultLaunchArgs)
      }
    },
    { retries: 5, delay: 10 * 1000, timeout: 30 * 10000 }
  ).then(async () => {
    await device.setURLBlacklist(['.*blockchain-api-dot-celo-mobile-mainnet.*'])
  })
}
