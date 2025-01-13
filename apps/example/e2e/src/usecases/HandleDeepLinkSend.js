import jestExpect from 'expect'
import { E2E_TEST_FAUCET } from '../../scripts/consts'
import { launchApp, reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, waitForElementById } from '../utils/utils'

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
/**
 * Returns the crypto symbol from the SendAmount element
 * @returns {Promise<string>}
 */
const getCryptoSymbol = async () => {
  const sendAmountCryptoElement = await element(by.id('SendAmount')).getAttributes()
  return sendAmountCryptoElement.label.split(' ').at(-1)
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

      const cryptoSymbol = await getCryptoSymbol()
      jestExpect(cryptoSymbol).toBe('cUSD')

      // Fiat amount should match value passed in deeplink
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
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30_000)
    })

    it('Then should handle deeplink without amount', async () => {
      await launchDeepLink({
        url: `celo://wallet/pay?address=${E2E_TEST_FAUCET}&currencyCode=USD&token=cUSD&displayName=TestFaucet`,
      })
      await waitForElementById('SendEnterAmount/TokenSelect')
      await expect(element(by.text('cUSD on Celo')).atIndex(0)).toBeVisible()
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementById('SendEnterAmount/ReviewButton', {
        timeout: 30_000,
        tap: true,
      })

      // Send Transaction
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
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

      const cryptoSymbol = await getCryptoSymbol()
      jestExpect(cryptoSymbol).toBe('cUSD')

      // Fiat amount should match value passed in deeplink
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

      const cryptoSymbol = await getCryptoSymbol()
      jestExpect(cryptoSymbol).toBe('cUSD')

      // Fiat amount should match value passed in deeplink
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
