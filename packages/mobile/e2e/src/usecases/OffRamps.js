import { dismissBanners } from '../utils/banners'
import { pixelDiff, sleep, enterPinUiIfNecessary } from '../utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '..utils/utils/consts'

export default offRamps = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
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

      it('Then Should Be Able To Navigate To Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('2')
        await element(by.id('FiatExchangeNextButton')).tap()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        const imagePath = await device.takeScreenshot('Cash Out Providers')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Cash Out Providers - ios.png'
            : './e2e/assets/Cash Out Providers - android.png'
        )
      })

      it('Then Should Be Able To Get Additional Info About Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('2')
        await element(by.id('FiatExchangeNextButton')).tap()
        await element(by.id('QuestionIcon')).tap()
        const imagePath = await device.takeScreenshot('Cash Out Providers Info Modal')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Cash Out Providers Info Modal - ios.png'
            : './e2e/assets/Cash Out Providers Info Modal - android.png'
        )
      })

      it('Then Should Throw Error For A Withdrawal Over Balance', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('5000')
        await element(by.id('FiatExchangeNextButton')).tap()
        await waitFor(element(by.id('SmartTopAlertTouchable')))
          .toBeVisible()
          .withTimeout(5000)
      })

      // TODO: Needs navigation back to run without impacting other specs
      it.skip('Then Xanpool Should Display', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('$50')
        await element(by.id('FiatExchangeNextButton')).tap()
        await element(by.id('Provider/Xanpool')).tap()
        await sleep(10000)
        const imagePath = await device.takeScreenshot('Xanpool')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Xanpool - ios.png'
            : './e2e/assets/Xanpool - android.png'
        )
      })
    })

    describe('When Gift Cards and Mobile Top Up Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBidali')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Bidali Should Display', async () => {
        await sleep(5000)
        const imagePath = await device.takeScreenshot('Bidali')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Bidali - ios.png'
            : './e2e/assets/Bidali - android.png'
        )
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      afterEach(async () => {
        await device.sendToHome()
        await device.launchApp({ newInstance: false })
      })

      it('Then Exchanges Should Display', async () => {
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        //TODO: Check Address is Displayed
        const imagePath = await device.takeScreenshot('Exchanges')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Crypto Out Exchanges - ios.png'
            : './e2e/assets/Crypto Out Exchanges - android.png'
        )
      })

      // These tests are Flakey On Android
      if (device.getPlatform() === 'ios') {
        it('Then Should Be Able To Navigate To Bittrex', async () => {
          await element(by.id('Bittrex')).tap()
          await sleep(5000)
          const imagePath = await device.takeScreenshot('Bittrex')
          await pixelDiff(
            imagePath,
            device.getPlatform() === 'ios'
              ? './e2e/assets/Bittrex - ios.png'
              : './e2e/assets/Bittrex - android.png'
          )
        })

        it('Then Should Be Able To Navigate To CoinList Pro', async () => {
          await element(by.id('CoinList Pro')).tap()
          await sleep(5000)
          const imagePath = await device.takeScreenshot('CoinList Pro')
          await pixelDiff(
            imagePath,
            device.getPlatform() === 'ios'
              ? './e2e/assets/CoinList Pro - ios.png'
              : './e2e/assets/CoinList Pro - android.png'
          )
        })

        it('Then Should Be Able To Navigate To OKCoin', async () => {
          await element(by.id('OKCoin')).tap()
          await sleep(5000)
          const imagePath = await device.takeScreenshot('OKCoin')
          await pixelDiff(
            imagePath,
            device.getPlatform() === 'ios'
              ? './e2e/assets/OKCoin - ios.png'
              : './e2e/assets/OKCoin - android.png'
          )
        })
      }
    })
  })

  describe('CELO', () => {
    beforeEach(async () => {
      await element(by.id('radio/CELO')).tap()
    })

    describe('When cUSD/CELO Address Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveOnAddress')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Cash Out Should Match Screenshot', async () => {
        const imagePath = await device.takeScreenshot('Cash Out')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Cash Out - ios.png'
            : './e2e/assets/Cash Out - android.png',
          2.5
        )
      })
    })

    describe('When cUSD/CELO Address Selected', () => {
      const randomAmount = `${Math.random().toFixed(3)}`

      beforeEach(async () => {
        await element(by.id('receiveOnAddress')).tap()
        await element(by.text('Next')).tap()
        // console.log('randomAmount: ', randomAmount)
        await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
        await element(by.id('CeloAmount')).replaceText(randomAmount)
        //TODO: Investigate why sleep is needed
        await sleep(1000)
        await element(by.id('WithdrawReviewButton')).tap()
      })

      it('Then Should Be Able To Send To Address', async () => {
        // console.log('randomAmount: ', `-${randomAmount} CELO`)
        await element(by.id('ConfirmWithdrawButton')).tap()
        await enterPinUiIfNecessary()
        await expect(element(by.text(`-${randomAmount} CELO`))).toBeVisible()
      })

      it('Then Should Be Able To Review', async () => {
        // console.log('randomAmount: ', randomAmount)
        await element(by.id('feeDrawer/WithdrawCelo')).tap()
        await expect(element(by.text(randomAmount)).atIndex(2)).toBeVisible()
      })

      it('Then Should Be Able To Edit From Review', async () => {
        await element(by.id('EditButton')).tap()
        await expect(element(by.text('Account No. or Address'))).toBeVisible()
        await expect(element(by.text('Amount (CELO)'))).toBeVisible()
        // await expect(element(by.text('Cash Out'))).toBeVisible()
      })

      it('Then Should Be Able To Cancel From Review', async () => {
        await element(by.id('CancelButton')).tap()
        await expect(element(by.id('radio/CELO'))).toBeVisible()
        await expect(element(by.id('radio/cUSD'))).toBeVisible()
        // await expect(element(by.text('Cash Out'))).toBeVisible()
      })

      it('Then Review Should Match Screenshot', async () => {
        const imagePath = await device.takeScreenshot('Cash Out Review')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Cash Out Review - ios.png'
            : './e2e/assets/Cash Out Review - android.png'
        )
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      it('Then Exchanges Should Display', async () => {
        await expect(element(by.id('Binance'))).toBeVisible()
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('Coinbase (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('Coinbase Pro (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        await expect(element(by.id('OKEx'))).toBeVisible()
      })

      it('Then Account Number Should Display', async () => {
        await expect(element(by.id('accountNumberContainer'))).toBeVisible()
        //TODO Get Attribute and confirm correct account number
      })

      it('Then Should Be Able To Navigate Back', async () => {
        await element(by.id('BackChevron')).atIndex(1).tap()
        await expect(element(by.id('radio/CELO'))).toBeVisible()
        await expect(element(by.id('radio/cUSD'))).toBeVisible()
      })
    })
  })
}
