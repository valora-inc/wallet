import { dismissBanners } from '../utils/banners'
import { pixelDiff, sleep } from '../utils/utils'

export default onRamps = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await element(by.id('addFunds')).tap()
  })

  describe('cUSD', () => {
    beforeEach(async () => {
      await element(by.id('radio/cUSD')).tap()
    })

    describe('When Debt Card Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithCard')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('FiatExchangeInput')).replaceText('$50')
        await element(by.id('FiatExchangeNextButton')).tap()
      })

      it('Then Should Display Providers', async () => {
        await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Provider/Ramp'))).toBeVisible()
        await expect(element(by.id('Provider/Transak'))).toBeVisible()
        const imagePath = await device.takeScreenshot('Cash In Providers')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Cash In Providers - ios.png'
            : './e2e/assets/Cash In Providers - android.png'
        )
      })

      it('Then Should Be Able To Go Back', async () => {
        // Check That We Navigate Away from The Previous Page
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        device.getPlatform === 'ios'
          ? await element(by.id('BackChevron')).atIndex(1).tap()
          : await element(by.id('BackChevron')).atIndex(2).tap()
        await expect(element(by.id('FiatExchangeNextButton'))).toBeVisible()
      })

      describe('External Providers', () => {
        afterEach(async () => {
          await device.sendToHome()
          await device.launchApp({ newInstance: false })
        })

        // TODO: Check providers on Android
        if (device.getPlatform() === 'ios') {
          it('Then Should Be Able To Navigate To Moonpay', async () => {
            await element(by.id('Provider/Moonpay')).tap()
            await sleep(10000)
            const imagePath = await device.takeScreenshot('Moonpay - ios')
            await pixelDiff(
              imagePath,
              device.getPlatform() === 'ios'
                ? './e2e/assets/Moonpay - ios.png'
                : './e2e/assets/Moonpay - android.png'
            )
          })

          it('Then Should Be Able To Navigate To Xanpool', async () => {
            await element(by.id('Provider/Xanpool')).tap()
            await sleep(10000)
            const imagePath = await device.takeScreenshot('Xanpool - ios')
            await pixelDiff(
              imagePath,
              device.getPlatform() === 'ios'
                ? './e2e/assets/Xanpool - ios.png'
                : './e2e/assets/Xanpool - android.png'
            )
          })

          it('Then Should Be Able To Navigate To Transak', async () => {
            await element(by.id('Provider/Transak')).tap()
            await sleep(10000)
            const imagePath = await device.takeScreenshot('Transak')
            await pixelDiff(
              imagePath,
              device.getPlatform() === 'ios'
                ? './e2e/assets/Transak - ios.png'
                : './e2e/assets/Transak - android.png'
            )
          })
        }

        // Skipped Due To Flakey Test Dependent on Wait
        it.skip('Then Should Be Able To Navigate To Simplex', async () => {
          await element(by.id('Provider/Simplex')).tap()
          await element(by.text('Continue to Simplex')).tap()
          await sleep(15000)
          const imagePath = await device.takeScreenshot('Simplex')
          await pixelDiff(
            imagePath,
            device.getPlatform() === 'ios'
              ? './e2e/assets/Simplex - ios.png'
              : './e2e/assets/Simplex - android.png'
          )
        })
      })
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithBank')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('FiatExchangeInput')).replaceText('$50')
        await element(by.id('FiatExchangeNextButton')).tap()
      })

      it('Then Should Display Providers', async () => {
        await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Provider/Ramp'))).toBeVisible()
        await expect(element(by.id('Provider/Transak'))).toBeVisible()
        const imagePath = await device.takeScreenshot('Cash In Providers')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Cash In Providers - ios.png'
            : './e2e/assets/Cash In Providers - android.png'
        )
      })

      it('Then Should Be Able To Go Back And Forth And Retain User Input', async () => {
        // Check That We Navigate Away from The Previous Page
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        device.getPlatform === 'ios'
          ? await element(by.id('BackChevron')).atIndex(1).tap()
          : await element(by.id('BackChevron')).atIndex(2).tap()
        await expect(element(by.id('Provider/Simplex'))).not.toBeVisible()
        await expect(element(by.text('50.00'))).toBeVisible()
        await element(by.id('FiatExchangeNextButton')).tap()
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(
          element(
            by.text('Please select a provider below. These links connect to a third party service.')
          )
        ).toBeVisible()
      })
    })

    describe('When Cryptocurrency Exchange Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Providers & Account Key', async () => {
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        await expect(element(by.id('accountNumberContainer'))).toBeVisible()
        const imagePath = await device.takeScreenshot('Cash In Exchanges')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Crypto In Exchanges - ios.png'
            : './e2e/assets/Crypto In Exchanges - android.png'
        )
      })
    })
  })

  describe('CELO', () => {
    beforeEach(async () => {
      await element(by.id('radio/CELO')).tap()
    })

    describe('When Debit Card Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithCard')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
      })

      it('Then Should Display Providers', async () => {
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Provider/Ramp'))).toBeVisible()
        await expect(element(by.id('Provider/Transak'))).toBeVisible()
        const imagePath = await device.takeScreenshot('Cash In Exchanges')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Cash In Providers - ios.png'
            : './e2e/assets/Cash In Providers - android.png'
        )
      })

      it('Then Should Be Able To Go Back', async () => {
        // Check That We Navigate Away from The Previous Page
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        device.getPlatform === 'ios'
          ? await element(by.id('BackChevron')).atIndex(1).tap()
          : await element(by.id('BackChevron')).atIndex(2).tap()
        await expect(element(by.id('FiatExchangeNextButton'))).toBeVisible()
      })
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithBank')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
      })

      it('Then Should Display Providers', async () => {
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Provider/Ramp'))).toBeVisible()
        await expect(element(by.id('Provider/Transak'))).toBeVisible()
        const imagePath = await device.takeScreenshot('Cash In Exchanges')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Cash In Providers - ios.png'
            : './e2e/assets/Cash In Providers - android.png'
        )
      })
    })

    describe('When Cryptocurrency Exchange Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Providers & Account Key', async () => {
        await expect(element(by.id('Binance'))).toBeVisible()
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('Coinbase (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('Coinbase Pro (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        await expect(element(by.id('OKEx'))).toBeVisible()
        await expect(element(by.id('accountNumberContainer'))).toBeVisible()
        const imagePath = await device.takeScreenshot('Crypto In Exchanges')
        await pixelDiff(
          imagePath,
          device.getPlatform() === 'ios'
            ? './e2e/assets/Crypto In Exchanges - ios.png'
            : './e2e/assets/Crypto In Exchanges - android.png'
        )
      })
    })
  })
}
