import { reloadReactNative } from '../utils/retries'
import { isElementVisible, waitForElementId } from '../utils/utils'
const jestExpect = require('expect')

export default onRamps = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await waitForElementId('addFunds')
    await element(by.id('addFunds')).tap()
  })

  describe('When Add Funds selected', () => {
    it.each`
      token     | amount
      ${'cUSD'} | ${'20'}
      ${'cUSD'} | ${'2'}
      ${'cEUR'} | ${'20'}
      ${'cEUR'} | ${'2'}
      ${'CELO'} | ${'20'}
      ${'CELO'} | ${'2'}
    `('Then should display $token provider(s) for $$amount', async ({ token, amount }) => {
      await waitForElementId(`radio/${token}`)
      await element(by.id(`radio/${token}`)).tap()
      await element(by.text('Next')).tap()
      await waitForElementId('FiatExchangeInput')
      await element(by.id('FiatExchangeInput')).replaceText(`${amount}`)
      await element(by.id('FiatExchangeNextButton')).tap()
      await expect(element(by.text('Select Payment Method'))).toBeVisible()
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
        await element(by.id('Card/section')).tap()
        // Check that best rate is displayed first
        await expect(
          element(by.id('Card/provider-0').withDescendant(by.id('Card/bestRate')))
        ).toExist()
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
        let bankProviders = await element(by.id('Card/numProviders')).getAttributes()
        numBankProviders =
          device.getPlatform() === 'ios'
            ? bankProviders.label.split(' ')[0]
            : bankProviders.text.split(' ')[0]
        await element(by.id('Bank/section')).tap()
        // Check that best rate is displayed first
        await expect(
          element(by.id('Bank/provider-0').withDescendant(by.id('Bank/bestRate')))
        ).toExist()
        // Check that the expected number of providers show
        for (let i = 0; i < numBankProviders; i++) {
          await expect(element(by.id(`Bank/provider-${i}`))).toExist()
        }
      }
    })

    // Verify that some exchanges are displayed not the exact total as this could change
    // Maybe use total in the future
    it.each`
      token     | exchanges
      ${'cUSD'} | ${{ total: 5, minExpected: 2 }}
      ${'cEUR'} | ${{ total: 2, minExpected: 1 }}
      ${'CELO'} | ${{ total: 19, minExpected: 5 }}
    `(
      'Then should display at least $exchanges.minExpected $token exchange(s)',
      async ({ token, exchanges }) => {
        await waitForElementId(`radio/${token}`)
        await element(by.id(`radio/${token}`)).tap()
        await element(by.text('Next')).tap()
        await waitForElementId('FiatExchangeInput')
        await element(by.id('FiatExchangeInput')).replaceText('20')
        await element(by.id('FiatExchangeNextButton')).tap()
        await expect(element(by.text('Select Payment Method'))).toBeVisible()
        await waitForElementId('Exchanges')
        await element(by.id('Exchanges')).tap()
        await waitForElementId('accountBox')
        // Exchanges start at index 0
        await waitForElementId(`provider-${exchanges.minExpected - 1}`)
      }
    )
  })
}
