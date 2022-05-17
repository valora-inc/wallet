import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, sleep, waitForElementId } from '../utils/utils'

const jestExpect = require('expect')

export default offRamps = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
  })

  describe('When on Add & Withdraw', () => {
    it('Then should have support link', async () => {
      await waitForElementId('otherFundingOptions')
    })

    it('Then should display total balance and navigate back', async () => {
      await waitForElementId('ViewBalances')
      await element(by.id('ViewBalances')).tap()
      await expect(element(by.text('Assets'))).toBeVisible()
      await element(by.id('BackChevron')).tap()
      await expect(element(by.text('Assets'))).not.toBeVisible()
      await waitForElementId('ViewBalances')
    })
  })

  describe('When Spend selected', () => {
    beforeEach(async () => {
      await waitForElementId('spend')
      await element(by.id('spend')).tap()
    })

    it('Then should be able to spend cUSD', async () => {
      await waitForElementId('radio/cUSD')
      await element(by.id('radio/cUSD')).tap()
      await element(by.id('GoToProviderButton')).tap()
      await waitForElementId('RNWebView')
      await expect(element(by.text('Bidali'))).toBeVisible()
    })

    it('Then should be able to spend cEUR', async () => {
      await waitForElementId('radio/cEUR')
      await element(by.id('radio/cEUR')).tap()
      await element(by.id('GoToProviderButton')).tap()
      await waitForElementId('RNWebView')
      await expect(element(by.text('Bidali'))).toBeVisible()
    })

    // TODO(tomm) debug why this is failing on Android
    it(':ios: Then should not be able to spend CELO', async () => {
      await waitForElementId('radio/CELO')
      let celoRadioButton = await element(by.id('radio/CELO')).getAttributes()
      jestExpect(celoRadioButton.enabled).toBeFalsy()
    })
  })

  describe('When Withdraw Selected', () => {
    beforeEach(async () => {
      await waitForElementId('cashOut')
      await element(by.id('cashOut')).tap()
    })

    it.each`
      token     | amount | exchanges
      ${'cUSD'} | ${'2'} | ${{ total: 5, minExpected: 2 }}
      ${'cEUR'} | ${'2'} | ${{ total: 2, minExpected: 1 }}
      ${'CELO'} | ${'2'} | ${{ total: 19, minExpected: 5 }}
    `(
      'Then should display $token provider(s) for $$amount',
      async ({ token, amount, exchanges }) => {
        await waitForElementId(`radio/${token}`)
        await element(by.id(`radio/${token}`)).tap()
        await element(by.text('Next')).tap()
        await waitForElementId('FiatExchangeInput')
        await element(by.id('FiatExchangeInput')).replaceText(`${amount}`)
        await element(by.id('FiatExchangeNextButton')).tap()
        await expect(element(by.text('Select Withdraw Method'))).toBeVisible()
        await waitForElementId('Exchanges')
        await element(by.id('Exchanges')).tap()
        // Exchanges start at index 0
        await waitForElementId(`provider-${exchanges.minExpected - 1}`)
      }
    )

    it('Then Send To Address', async () => {
      const randomAmount = `${(Math.random() * 10 ** -1).toFixed(3)}`
      await waitForElementId('radio/CELO')
      await element(by.id('radio/CELO')).tap()
      await element(by.text('Next')).tap()
      await waitForElementId('FiatExchangeInput')
      await element(by.id('FiatExchangeInput')).replaceText(`${randomAmount}`)
      await element(by.id('FiatExchangeNextButton')).tap()
      await waitForElementId('Exchanges')
      await element(by.id('Exchanges')).tap()
      await element(by.id('WithdrawCeloButton')).tap()
      await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
      await element(by.id('CeloAmount')).replaceText(randomAmount)
      //TODO: Investigate why sleep is needed
      await sleep(1000)
      await element(by.id('WithdrawReviewButton')).tap()
      // Confirm withdrawal for randomAmount
      await element(by.id('ConfirmWithdrawButton')).tap()
      // Enter PIN if necessary
      await enterPinUiIfNecessary()
      // Assert we've arrived at the home screen
      await waitForElementId('SendOrRequestBar')
      // flakey due to alfajores blockscout issues
      // We might want to fix to make the transaction feed { tx receipts } ∪ { blockscout txs }
      // Assert send transaction is present in feed
      // const target = element(
      //   by.text(`-${randomAmount} CELO`).withAncestor(by.id('TransactionList'))
      // ).atIndex(0)
      // await waitFor(target)
      //   .toBeVisible()
      //   .withTimeout(30 * 1000)
      // await expect(target).toBeVisible()
    })
  })
}
