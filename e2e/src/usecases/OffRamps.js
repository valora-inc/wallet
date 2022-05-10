import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, sleep, waitForElementId } from '../utils/utils'

export default offRamps = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await waitForElementId('cashOut')
    await element(by.id('cashOut')).tap()
  })

  describe('cUSD', () => {
    beforeEach(async () => {
      await waitForElementId('radio/cUSD')
      await element(by.id('radio/cUSD')).tap()
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBank')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Be Display No Providers Message', async () => {
        await waitForElementId('FiatExchangeInput')
        // Enter Amount to Exchange
        await element(by.id('FiatExchangeInput')).replaceText('2')
        // Got To Exchanges
        await element(by.id('FiatExchangeNextButton')).tap()
        // Check Page Elements
        await waitForElementId('noProviders')
        await waitForElementId('ContactSupport')
      })
    })

    describe('When Gift Cards and Mobile Top Up Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBidali')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Bidali Should Display', async () => {
        await waitForElementId('RNWebView')
        await expect(element(by.text('Bidali'))).toBeVisible()
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      it('Then Should Display Exchanges', async () => {
        await waitForElementId('provider-0')
        await expect(element(by.id('provider-1'))).toBeVisible()
        await expect(element(by.id('provider-2'))).toBeVisible()
      })
    })
  })

  describe('cEUR', () => {
    beforeEach(async () => {
      await waitForElementId('radio/cEUR')
      await element(by.id('radio/cEUR')).tap()
    })

    describe('When Gift Cards and Mobile Top Up Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBidali')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Bidali Should Display', async () => {
        await waitForElementId('RNWebView')
        await expect(element(by.text('Bidali'))).toBeVisible()
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      it('Then Should Display Exchanges', async () => {
        await waitForElementId('provider-0')
        await expect(element(by.id('provider-1'))).toExist()
      })
    })
  })

  describe('CELO', () => {
    beforeEach(async () => {
      await waitForElementId('radio/CELO')
      await element(by.id('radio/CELO')).tap()
    })

    describe('When Address Selected', () => {
      const randomAmount = `${(Math.random() * 10 ** -1).toFixed(3)}`

      beforeEach(async () => {
        await element(by.id('receiveOnAddress')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
        await element(by.id('CeloAmount')).replaceText(randomAmount)
        //TODO: Investigate why sleep is needed
        await sleep(1000)
        await element(by.id('WithdrawReviewButton')).tap()
      })

      it('Then Send To Address', async () => {
        // Confirm withdrawal for randomAmount
        await element(by.id('ConfirmWithdrawButton')).tap()
        // Enter PIN if necessary
        await enterPinUiIfNecessary()
        // Assert we've arrived at the home screen
        await waitForElementId('SendOrRequestBar')
        // Failing due to alfajores blockscout issues
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

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      it('Then Should Display Exchanges & Withdraw CELO Button', async () => {
        await waitForElementId('provider-0')
        await expect(element(by.id('provider-1'))).toBeVisible()
        await expect(element(by.id('provider-2'))).toBeVisible()
        await expect(element(by.id('WithdrawCeloButton'))).toBeVisible()
      })
    })
  })
}
