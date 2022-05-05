import { reloadReactNative } from '../utils/retries'
import { waitForElementId } from '../utils/utils'
const jestExpect = require('expect')

export default onRamps = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await element(by.id('addFunds')).tap()
  })

  describe('cUSD', () => {
    beforeEach(async () => {
      await waitForElementId('radio/cUSD')
      await element(by.id('radio/cUSD')).tap()
    })

    describe('When Debt Card Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithCard')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
        // Ramp displays with with fee
        await waitForElementId('Provider/Ramp')
        await waitForElementId('Icon/Ramp')
        await expect(element(by.id('ProviderFee/Ramp'))).toHaveText('$1.46')
        // Simplex displays with fee
        await waitForElementId('Provider/Simplex')
        await waitForElementId('Icon/Simplex')
        await expect(element(by.id('ProviderFee/Simplex'))).toHaveText('$10.00')
        // Transak, Moonpay, Xanpool should not displayed
        await expect(element(by.id('Provider/Transak'))).not.toExist()
        await expect(element(by.id('Provider/Moonpay'))).not.toExist()
        await expect(element(by.id('Provider/Xanpool'))).not.toExist()
      })
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithBank')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
        // Ramp displays with with fee
        await waitForElementId('Provider/Ramp')
        await waitForElementId('Icon/Ramp')
        await expect(element(by.id('ProviderFee/Ramp'))).toHaveText('$1.46')
        // Simplex displays restricted with fee
        await waitForElementId('Provider/Simplex')
        await waitForElementId('Icon/Simplex')
        await expect(element(by.id('ProviderFee/Simplex'))).toHaveText('$10.00')
        await expect(element(by.id('RestrictedText/Simplex'))).toBeVisible()
        // Transak, Moonpay, Xanpool should not displayed
        await expect(element(by.id('Provider/Transak'))).not.toExist()
        await expect(element(by.id('Provider/Moonpay'))).not.toExist()
        await expect(element(by.id('Provider/Xanpool'))).not.toExist()
      })
    })

    describe('When Cryptocurrency Exchange Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Exchanges & Account Address', async () => {
        await waitForElementId('accountBox')
        // Wait for https://github.com/wix/Detox/issues/3196 to be fixed to remove hack
        if (device.getPlatform() === 'ios') {
          let providerList = await element(by.id('provider')).getAttributes()
          // Confirm at least 5 exchanges display
          jestExpect(providerList.elements.length).toBeGreaterThanOrEqual(5)
        } else {
          waitForElementId('provider-4')
        }
      })
    })
  })

  describe('cEUR', () => {
    beforeEach(async () => {
      await waitForElementId('radio/cEUR')
      await element(by.id('radio/cEUR')).tap()
    })

    describe('When Debit Card Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithCard')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
        // Ramp displays with with fee
        await waitForElementId('Provider/Ramp')
        await waitForElementId('Icon/Ramp')
        await expect(element(by.id('ProviderFee/Ramp'))).toExist()
        // Transak, Moonpay, Xanpool, Simplex should not displayed
        await expect(element(by.id('Provider/Transak'))).not.toExist()
        await expect(element(by.id('Provider/Moonpay'))).not.toExist()
        await expect(element(by.id('Provider/Xanpool'))).not.toExist()
        await expect(element(by.id('Provider/Simplex'))).not.toExist()
      })
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithBank')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
        // Ramp displays with with fee
        await waitForElementId('Provider/Ramp')
        await waitForElementId('Icon/Ramp')
        await expect(element(by.id('ProviderFee/Ramp'))).toExist()
        // Transak, Moonpay, Xanpool, Simplex should not displayed
        await expect(element(by.id('Provider/Transak'))).not.toExist()
        await expect(element(by.id('Provider/Moonpay'))).not.toExist()
        await expect(element(by.id('Provider/Xanpool'))).not.toExist()
        await expect(element(by.id('Provider/Simplex'))).not.toExist()
      })
    })

    describe('When Cryptocurrency Exchange Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Exchanges & Account Address', async () => {
        await waitForElementId('accountBox')
        if (device.getPlatform() === 'ios') {
          let providerList = await element(by.id('provider')).getAttributes()
          // Confirm at least 2 exchanges display
          jestExpect(providerList.elements.length).toBeGreaterThanOrEqual(2)
        } else {
          waitForElementId('provider-1')
        }
      })
    })
  })

  describe('CELO', () => {
    beforeEach(async () => {
      await waitForElementId('radio/CELO')
      await element(by.id('radio/CELO')).tap()
    })

    describe('When Debit Card Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithCard')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
        // Ramp displays with with fee
        await waitForElementId('Provider/Ramp')
        await waitForElementId('Icon/Ramp')
        await expect(element(by.id('ProviderFee/Ramp'))).toExist()
        // Simplex displays with fee
        await waitForElementId('Provider/Simplex')
        await waitForElementId('Icon/Simplex')
        await expect(element(by.id('ProviderFee/Simplex'))).toHaveText('$10.00')
        // Transak, Moonpay, Xanpool should not displayed
        await expect(element(by.id('Provider/Transak'))).not.toExist()
        await expect(element(by.id('Provider/Moonpay'))).not.toExist()
        await expect(element(by.id('Provider/Xanpool'))).not.toExist()
      })
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithBank')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
        // Ramp displays with with fee
        await waitForElementId('Provider/Ramp')
        await waitForElementId('Icon/Ramp')
        await expect(element(by.id('ProviderFee/Ramp'))).toExist()
        // Simplex displays restricted with fee
        await waitForElementId('Provider/Simplex')
        await waitForElementId('Icon/Simplex')
        await expect(element(by.id('ProviderFee/Simplex'))).toHaveText('$10.00')
        await expect(element(by.id('RestrictedText/Simplex'))).toBeVisible()
        // Transak, Moonpay, Xanpool should not displayed
        await expect(element(by.id('Provider/Transak'))).not.toExist()
        await expect(element(by.id('Provider/Moonpay'))).not.toExist()
        await expect(element(by.id('Provider/Xanpool'))).not.toExist()
      })
    })

    describe('When Cryptocurrency Exchange Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Exchanges & Account Address', async () => {
        await waitForElementId('accountBox')
        if (device.getPlatform() === 'ios') {
          let providerList = await element(by.id('provider')).getAttributes()
          // Confirm at least 5 exchanges display
          jestExpect(providerList.elements.length).toBeGreaterThanOrEqual(5)
        } else {
          waitForElementId('provider-4')
        }
      })
    })
  })
}
