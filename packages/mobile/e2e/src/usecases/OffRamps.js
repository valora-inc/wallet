import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, sleep } from '../utils/utils'

export default offRamps = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    // Waiting for element to be visible for up to 5 seconds before tap
    await waitFor(element(by.id('cashOut')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.id('cashOut')).tap()
  })

  describe('cUSD', () => {
    beforeEach(async () => {
      await waitFor(element(by.id('radio/cUSD')))
        .toBeVisible()
        .withTimeout(10 * 1000)
      await element(by.id('radio/cUSD')).tap()
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBank')).tap()
        await element(by.text('Next')).tap()
      })

      jest.retryTimes(2)
      it('Then Should Be Display No Providers Message', async () => {
        await waitFor(element(by.id('FiatExchangeInput')))
          .toBeVisible()
          .withTimeout(10 * 1000)
        // Enter Amount to Exchange
        await element(by.id('FiatExchangeInput')).replaceText('2')
        // Got To Exchanges
        await element(by.id('FiatExchangeNextButton')).tap()
        // Check Page Elements
        await waitFor(element(by.id('noProviders')))
          .toBeVisible()
          .withTimeout(10 * 1000)
        await expect(element(by.id('ContactSupport'))).toBeVisible()
      })
    })

    describe.skip('When Gift Cards and Mobile Top Up Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBidali')).tap()
        await element(by.text('Next')).tap()
      })

      jest.retryTimes(2)
      it('Then Bidali Should Display', async () => {
        await expect(element(by.text('Bidali'))).toBeVisible()
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      jest.retryTimes(2)
      it('Then Should Display Exchanges', async () => {
        await waitFor(element(by.id('Bittrex')))
          .toBeVisible()
          .withTimeout(20 * 1000)
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
      })
    })
  })

  describe('cEUR', () => {
    beforeEach(async () => {
      await waitFor(element(by.id('radio/cEUR')))
        .toBeVisible()
        .withTimeout(10 * 1000)
      await element(by.id('radio/cEUR')).tap()
    })

    jest.retryTimes(2)
    describe('When Gift Cards and Mobile Top Up Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBidali')).tap()
        await element(by.text('Next')).tap()
      })

      // TODO (Tom): figure out why running this test is causing detox connection issues with the app
      // Most likely culprits is the internal webview we use not playing nice with detox
      it.skip('Then Display Bidali', async () => {
        await expect(element(by.text('Bidali'))).toBeVisible()
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      jest.retryTimes(2)
      it('Then Should Display No Exchanges Available Text', async () => {
        // Check page elements
        await expect(element(by.id('NoExchanges'))).toHaveText(
          'There are no exchanges available for cEUR in your region.'
        )

        // Check presence of buttons
        await expect(element(by.id('SwitchCurrency'))).toBeVisible()
        await expect(element(by.id('ContactSupport'))).toBeVisible()
      })
    })
  })

  describe('CELO', () => {
    beforeEach(async () => {
      await waitFor(element(by.id('radio/CELO')))
        .toBeVisible()
        .withTimeout(10 * 1000)
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

      jest.retryTimes(2)
      it('Then Send To Address', async () => {
        // Confirm withdrawal for randomAmount
        await element(by.id('ConfirmWithdrawButton')).tap()
        // Enter PIN if necessary
        await enterPinUiIfNecessary()
        // Assert send transaction is present in feed
        await expect(
          element(by.text(`-${randomAmount} CELO`).withAncestor(by.id('TransactionList'))).atIndex(
            0
          )
        ).toBeVisible()
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      jest.retryTimes(2)
      it('Then Should Display Exchanges & Withdraw CELO Button', async () => {
        await waitFor(element(by.id('Binance')))
          .toBeVisible()
          .withTimeout(20 * 1000)
        await expect(element(by.id('Binance'))).toBeVisible()
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('Coinbase (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('Coinbase Pro (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        await expect(element(by.id('OKEx'))).toBeVisible()
        await expect(element(by.id('WithdrawCeloButton'))).toBeVisible()
      })
    })
  })
}
