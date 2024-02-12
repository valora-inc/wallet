import { launchApp, reloadReactNative } from '../utils/retries'
import { waitForElementId } from '../utils/utils'

export default offRamps = () => {
  beforeAll(async () => {
    await launchApp({
      newInstance: true,
    })
  })
  beforeEach(async () => {
    await reloadReactNative()
    await waitForElementId('HomeActionsCarousel')
    await element(by.id('HomeActionsCarousel')).scrollTo('right')
    await waitForElementId('HomeAction-Withdraw')
    await element(by.id('HomeAction-Withdraw')).tap()
  })

  describe('When on Add & Withdraw', () => {
    it('Then should have support link', async () => {
      await element(by.id('FiatExchange/scrollView')).scrollTo('bottom')
      await expect(element(by.id('otherFundingOptions'))).toBeVisible()
    })

    it('Then should display total balance and navigate back', async () => {
      await waitForElementId('ViewBalances')
      await element(by.id('ViewBalances')).tap()
      await expect(element(by.id('AssetsTokenBalance'))).toBeVisible()
      await element(by.id('BackChevron')).tap()
      await expect(element(by.id('AssetsTokenBalance'))).not.toBeVisible()
      await waitForElementId('ViewBalances')
    })
  })

  describe('When Spend selected', () => {
    beforeEach(async () => {
      await waitForElementId('spend')
      await element(by.id('spend')).tap()
    })

    it('Then should be able to spend cUSD', async () => {
      await waitForElementId(`cUSDSymbol`)
      await element(by.id(`cUSDSymbol`)).tap()

      await waitForElementId('RNWebView')
      await expect(element(by.text('Bidali'))).toBeVisible()
    })

    it('Then should be able to spend cEUR', async () => {
      await waitForElementId(`cEURSymbol`)
      await element(by.id(`cEURSymbol`)).tap()

      await waitForElementId('RNWebView')
      await expect(element(by.text('Bidali'))).toBeVisible()
    })
  })

  describe('When Withdraw Selected', () => {
    beforeEach(async () => {
      await waitForElementId('cashOut')
      await element(by.id('cashOut')).tap()
    })

    // Verify that some exchanges are displayed not the exact total as this could change
    // Maybe use total in the future
    it.each`
      token     | exchanges
      ${'cUSD'} | ${{ total: 5, minExpected: 1 }}
      ${'cEUR'} | ${{ total: 2, minExpected: 1 }}
      ${'CELO'} | ${{ total: 19, minExpected: 5 }}
    `(
      'Then should display at least $exchanges.minExpected $token exchange(s)',
      async ({ token, exchanges }) => {
        await waitForElementId(`${token}Symbol`)
        await element(by.id(`${token}Symbol`)).tap()

        await waitForElementId('FiatExchangeInput')
        await element(by.id('FiatExchangeInput')).replaceText('2')
        await element(by.id('FiatExchangeNextButton')).tap()
        await expect(element(by.text('Select Withdraw Method'))).toBeVisible()
        await waitForElementId('Exchanges')
        await element(by.id('Exchanges')).tap()
        await waitForElementId('SendBar')
        // Exchanges start at index 0
        await waitForElementId(`provider-${exchanges.minExpected - 1}`)
      }
    )

    it('Then Send To Address', async () => {
      const randomAmount = `${(Math.random() * 10 ** -1).toFixed(3)}`
      await waitForElementId(`CELOSymbol`)
      await element(by.id(`CELOSymbol`)).tap()

      await waitForElementId('FiatExchangeInput')
      await element(by.id('FiatExchangeInput')).replaceText(`${randomAmount}`)
      await element(by.id('FiatExchangeNextButton')).tap()
      await waitForElementId('Exchanges')
      await element(by.id('Exchanges')).tap()
      await element(by.id('SendBar')).tap()
      await waitFor(element(by.id('SendSelectRecipientSearchInput')))
        .toBeVisible()
        .withTimeout(10 * 1000)
      // Send e2e test should cover the rest of this flow
    })
  })
}
