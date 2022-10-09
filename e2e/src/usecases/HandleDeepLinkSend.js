import { launchApp, reloadReactNative } from '../utils/retries'
import { inputNumberKeypad, quote } from '../utils/utils'

const deepLinks = {
  withAll:
    'kolektivo://wallet/pay?address=0xC0509a7dcc69a0B28c7Ca73feD2FF06b9d59E5b9&amount=0.1&currencyCode=USD&token=cUSD&displayName=TestFaucet&comment=sending+usd:+0.1+to+my+wallet',
  withoutAmount:
    'kolektivo://wallet/pay?address=0xC0509a7dcc69a0B28c7Ca73feD2FF06b9d59E5b9&currencyCode=USD&token=cUSD&displayName=TestFaucet&comment=sending+usd:+0.1+to+my+wallet',
  withoutAddress:
    'kolektivo://wallet/pay?amount=0.1&currencyCode=USD&token=cUSD&displayName=TestFaucet&comment=sending+usd:+0.1+to+my+wallet',
}

// Helper functions
const launchDeepLink = async (url, newInstance = true) => {
  await device.terminateApp()
  await launchApp({ url: url, newInstance: newInstance })
}

const openDeepLink = async (payUrl) => {
  await reloadReactNative()
  await device.openURL({ url: payUrl })
}

export default HandleDeepLinkSend = () => {
  describe('When Launching Deeplink - App Closed', () => {
    it('Then should handle deeplink with all attributes', async () => {
      const PAY_URL = quote(deepLinks.withAll)
      await launchDeepLink(PAY_URL)
      await waitFor(element(by.id('SendAmount')))
        .toHaveText('$0.10')
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('DisplayName')))
        .toHaveText('TestFaucet')
        .withTimeout(10 * 1000)
      await waitFor(element(by.text('sending usd: 0.1 to my wallet')))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('Then should handle deeplink without amount', async () => {
      const PAY_URL = quote(deepLinks.withoutAmount)
      await launchDeepLink(PAY_URL)
      await inputNumberKeypad('0.1')
      await element(by.id('Review')).tap()
    })

    it('Then should error if no address provided', async () => {
      // TODO we should maybe throw an error to the user instead of silently failing
      const PAY_URL = quote(deepLinks.withoutAddress)
      await launchDeepLink(PAY_URL)
      await expect(element(by.id('SendAmount'))).not.toBeVisible()
    })
  })

  describe(':ios: When Launching Deeplink - App Backgrounded', () => {
    beforeEach(async () => {
      await reloadReactNative()
      await device.sendToHome()
    })

    it('Then should handle deeplink with all attributes', async () => {
      const PAY_URL = quote(deepLinks.withAll)
      await launchDeepLink(PAY_URL, false)
      await waitFor(element(by.id('SendAmount')))
        .toHaveText('$0.10')
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('DisplayName')))
        .toHaveText('TestFaucet')
        .withTimeout(10 * 1000)
      await waitFor(element(by.text('sending usd: 0.1 to my wallet')))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('Then should error if no address provided', async () => {
      const PAY_URL = quote(deepLinks.withoutAddress)
      await launchDeepLink(PAY_URL, false)
      await expect(element(by.id('SendAmount'))).not.toBeVisible()
    })
  })

  describe(':ios: When Opening Deeplink - App in Foreground', () => {
    it('Then should handle deeplink with all attributes', async () => {
      const PAY_URL = quote(deepLinks.withAll)
      await openDeepLink(PAY_URL)
      await waitFor(element(by.id('SendAmount')))
        .toHaveText('$0.10')
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('DisplayName')))
        .toHaveText('TestFaucet')
        .withTimeout(10 * 1000)
      await waitFor(element(by.text('sending usd: 0.1 to my wallet')))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('Then should error if no address provided', async () => {
      const PAY_URL = quote(deepLinks.withoutAddress)
      await openDeepLink(PAY_URL)
      await expect(element(by.id('SendAmount'))).not.toBeVisible()
    })
  })

  // On Android there are two ways to "exit" the app
  // 1. home button
  // 2. back button
  // there is a slight but important difference because with the back button
  // the activity gets destroyed and listeners go away which can cause subtle bugs
  it.skip(':android: Send url while app is in background, back pressed', async () => {
    await reloadReactNative()
    await device.pressBack()
    await launchApp({ url: PAY_URL, newInstance: false })
    await expect(element(by.id('Review'))).toBeVisible()
  })
}
