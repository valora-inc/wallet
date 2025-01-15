import { launchApp } from '../utils/retries'
import { isElementVisible, sleep, waitForElementById, waitForElementByText } from '../utils/utils'

async function multiTap(testID, { numberOfTaps = 2 } = {}) {
  try {
    for (let i = 0; i < numberOfTaps; i++) {
      await waitForElementById(testID, { tap: true })
    }
  } catch {}
}

export default onRamps = () => {
  beforeAll(async () => {
    await launchApp()
  })

  beforeEach(async () => {
    await waitForElementById('HomeAction-Add')
    await element(by.id('HomeAction-Add')).tap()
    await sleep(5000)
  })

  afterEach(async () => {
    await multiTap('BackChevron')
  })

  it.each`
    token     | amount
    ${'cUSD'} | ${'20'}
    ${'cUSD'} | ${'2'}
    ${'cEUR'} | ${'20'}
    ${'cEUR'} | ${'2'}
    ${'CELO'} | ${'20'}
    ${'CELO'} | ${'2'}
  `('Should display $token provider(s) for $$amount', async ({ token, amount }) => {
    // We use multiTap as sometimes the network select renders above the bottom sheet
    // This appears to be a detox specific issue as it is not reproducible in a non detox build
    await multiTap(`${token}Symbol`)
    await waitForElementById('FiatExchangeInput')
    await element(by.id('FiatExchangeInput')).replaceText(`${amount}`)
    await waitForElementById('FiatExchangeNextButton', { tap: true })
    await waitForElementByText({ text: 'Select Payment Method' })
    // Check IF Single Card Provider
    if (await isElementVisible('Card/singleProvider')) {
      await expect(element(by.id('Card/provider-0'))).toExist()
      await expect(element(by.id('Card/provider-1'))).not.toExist()
    }
    // Check IF Multiple Card Providers
    if (await isElementVisible('Card/numProviders')) {
      let cardProviders = await element(by.id('Card/numProviders')).getAttributes()
      numCardProviders =
        device.getPlatform() === 'ios'
          ? cardProviders.label.split(' ')[0]
          : cardProviders.text.split(' ')[0]
      // Check that the expected number of providers show
      for (let i = 0; i < numCardProviders; i++) {
        await expect(element(by.id(`Card/provider-${i}`))).toExist()
      }
    }
    // Check IF Single Bank Provider
    if (await isElementVisible('Bank/singleProvider')) {
      await expect(element(by.id('Bank/provider-0'))).toExist()
      await expect(element(by.id('Bank/provider-1'))).not.toExist()
    }
    // Check IF Multiple Bank Providers
    if (await isElementVisible('Bank/numProviders')) {
      let bankProviders = await element(by.id('Bank/numProviders')).getAttributes()
      numBankProviders =
        device.getPlatform() === 'ios'
          ? bankProviders.label.split(' ')[0]
          : bankProviders.text.split(' ')[0]
      // Check that the expected number of providers show
      for (let i = 0; i < numBankProviders; i++) {
        await expect(element(by.id(`Bank/provider-${i}`))).toExist()
      }
    }
  })
}
