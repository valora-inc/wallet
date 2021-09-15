import { dismissBanners } from '../utils/banners'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, getDeviceModel, pixelDiff, sleep } from '../utils/utils'
const jestExpect = require('expect')

export default offRamps = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    // Waiting for element to be visible for up to 5 seconds before tap
    await waitFor(element(by.id('cashOut')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('cashOut')).tap()
  })

  describe('cUSD', () => {
    beforeEach(async () => {
      await element(by.id('radio/cUSD')).tap()
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBank')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Be Display No Providers Message', async () => {
        // Enter Amount to Exchange
        await element(by.id('FiatExchangeInput')).replaceText('2')
        // Got To Exchanges
        await element(by.id('FiatExchangeNextButton')).tap()
        // Check Page Elements
        await expect(element(by.id('noProviders'))).toHaveText(
          'There are no providers available for cUSD in your country.'
        )
        await expect(element(by.id('ContactSupport'))).toBeVisible()

        // Check Screenshot
        const imagePath = await device.takeScreenshot('No cUSD Out Providers')
        await pixelDiff(
          imagePath,
          `./e2e/assets/${await getDeviceModel()}/No cUSD Out Providers.png`
        )
      })
    })

    describe.skip('When Gift Cards and Mobile Top Up Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBidali')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Bidali Should Display', async () => {
        await expect(element(by.text('Bidali'))).toBeVisible()
        // TODO: Include Check of Screenshot in Nightly Tests
        // await sleep(15000)
        // const imagePath = await device.takeScreenshot('Bidali')
        // await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/Bidali.png`)
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      it('Then Should Display Exchanges', async () => {
        await waitFor(element(by.id('Bittrex')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        const imagePath = await device.takeScreenshot('cUSD Exchanges')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/cUSD Out Exchanges.png`)
      })
    })
  })

  describe('cEUR', () => {
    beforeEach(async () => {
      await element(by.id('radio/cEUR')).tap()
    })

    describe('When Gift Cards and Mobile Top Up Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBidali')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Bidali Should Display', async () => {
        await expect(element(by.text('Bidali'))).toBeVisible()
        // TODO: Include Check of Screenshot in Nightly Tests
        // await sleep(15000)
        // const imagePath = await device.takeScreenshot('Bidali')
        // await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/Bidali.png`)
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      it('Then Should Display No Exchanges Available Text', async () => {
        // Check page elements
        await expect(element(by.id('NoExchanges'))).toHaveText(
          'There are no exchanges available for cEUR in your country.'
        )

        // Check presence of buttons
        await expect(element(by.id('SwitchCurrency'))).toBeVisible()
        await expect(element(by.id('ContactSupport'))).toBeVisible()
      })
    })
  })

  describe('CELO', () => {
    beforeEach(async () => {
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

      it('Then Should Be Able To Send To Address', async () => {
        // Confirm withdrawal for randomAmount
        await element(by.id('ConfirmWithdrawButton')).tap()
        // Enter PIN if necessary
        await enterPinUiIfNecessary()
        // Use Different Assertions for iOS and Android
        if (device.getPlatform() === 'ios') {
          // Get values of all feed values - iOS
          let valuesSent = await element(by.id('FeedItemAmountDisplay/value')).getAttributes()
          // Check text amount in the most recent transaction
          jestExpect(valuesSent.elements[0].text).toEqual(`-${randomAmount} CELO`)
        } else {
          // Check that the text of amount at index 0 is visible - Android
          await waitFor(element(by.text(`-${randomAmount} CELO`)).atIndex(0))
            .toBeVisible()
            .withTimeout(5000)
        }
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      it('Then Should Display Exchanges & Send CELO Button', async () => {
        await waitFor(element(by.id('Binance')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Binance'))).toBeVisible()
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('Coinbase (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('Coinbase Pro (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        await expect(element(by.id('OKEx'))).toBeVisible()
        await expect(element(by.id('SendCeloButton'))).toBeVisible()
        const imagePath = await device.takeScreenshot('CELO Out Exchanges')
        await pixelDiff(
          imagePath,
          `./e2e/assets/${await getDeviceModel()}/CELO Out Exchanges.png`,
          4
        )
      })
    })
  })
}
