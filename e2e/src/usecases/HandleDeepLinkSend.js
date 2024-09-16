import { E2E_TEST_FAUCET } from '../../scripts/consts'
import { launchApp, reloadReactNative } from '../utils/retries'
import {
  enterPinUiIfNecessary,
  quote,
  waitForElementByIdAndTap,
  waitForElementId,
} from '../utils/utils'

const deepLinks = {
  withoutAddress:
    'celo://wallet/pay?amount=0.01&currencyCode=USD&token=cUSD&displayName=TestFaucet',
}

// Helper functions
const launchDeepLink = async ({ url, newInstance = true }) => {
  await device.terminateApp()
  await launchApp({
    url,
    newInstance,
  })
}

const openDeepLink = async (payUrl) => {
  await reloadReactNative()
  await device.openURL({ url: payUrl })
}

export default HandleDeepLinkSend = () => {
  describe('When Launching Deeplink - App Closed', () => {
    it('Then should handle deeplink with all attributes', async () => {
      await launchDeepLink({
        url: `celo://wallet/pay?address=${E2E_TEST_FAUCET}&amount=0.01&currencyCode=USD&token=cUSD&displayName=TestFaucet`,
      })
      await waitFor(element(by.id('SendAmount')))
        .toHaveText('0.0067 cUSD') // alfajores uses 1.5 as price for all tokens
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('SendAmountFiat')))
        .toHaveText('$0.01')
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('DisplayName')))
        .toHaveText('TestFaucet')
        .withTimeout(10 * 1000)

      // Send Transaction
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitForElementByIdAndTap('Tab/Wallet')
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30_000)
    })

    it('Then should handle deeplink without amount', async () => {
      await launchDeepLink({
        url: `celo://wallet/pay?address=${E2E_TEST_FAUCET}&currencyCode=USD&token=cUSD&displayName=TestFaucet`,
      })
      await waitForElementId('SendEnterAmount/TokenSelect', 10_000)
      await expect(element(by.text('cUSD')).atIndex(0)).toBeVisible()
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)

      // Send Transaction
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitForElementByIdAndTap('Tab/Wallet')
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30_000)
    })

    it('Then should error if no address provided', async () => {
      // TODO we should maybe throw an error to the user instead of silently failing
      await launchDeepLink({
        url: deepLinks.withoutAddress,
      })
      await expect(element(by.id('SendAmount'))).not.toBeVisible()
    })
  })

  describe(':ios: When Launching Deeplink - App Backgrounded', () => {
    beforeEach(async () => {
      await reloadReactNative()
      await device.sendToHome()
    })

    it('Then should handle deeplink with all attributes', async () => {
      const deepLinksWithAll = `celo://wallet/pay?address=${E2E_TEST_FAUCET}&amount=0.01&currencyCode=USD&token=cUSD&displayName=TestFaucet`
      await launchDeepLink({ url: deepLinksWithAll, newInstance: false })
      await waitFor(element(by.id('SendAmount')))
        .toHaveText('0.0067 cUSD') // alfajores uses 1.5 as price for all tokens
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('SendAmountFiat')))
        .toHaveText('$0.01')
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('DisplayName')))
        .toHaveText('TestFaucet')
        .withTimeout(10 * 1000)

      // Send Transaction
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitForElementByIdAndTap('Tab/Wallet')
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30_000)
    })

    it('Then should error if no address provided', async () => {
      await launchDeepLink({ url: deepLinks.withoutAddress, newInstance: false })
      await expect(element(by.id('SendAmount'))).not.toBeVisible()
    })
  })

  describe(':ios: When Opening Deeplink - App in Foreground', () => {
    it('Then should handle deeplink with all attributes', async () => {
      const deepLinksWithAll = `celo://wallet/pay?address=${E2E_TEST_FAUCET}&amount=0.01&currencyCode=USD&token=cUSD&displayName=TestFaucet`
      await openDeepLink(deepLinksWithAll)
      await waitFor(element(by.id('SendAmount')))
        .toHaveText('0.0067 cUSD') // alfajores uses 1.5 as price for all tokens
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('SendAmountFiat')))
        .toHaveText('$0.01')
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('DisplayName')))
        .toHaveText('TestFaucet')
        .withTimeout(10 * 1000)

      // Send Transaction
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitForElementByIdAndTap('Tab/Wallet')
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30_000)
    })

    it('Then should error if no address provided', async () => {
      await openDeepLink(deepLinks.withoutAddress)
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
