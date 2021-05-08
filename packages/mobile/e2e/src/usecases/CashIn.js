import { dismissBanners } from '../utils/banners'

export default CashIn = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await element(by.id('addFunds')).tap()
    await element(by.id('GoToProviderButton')).tap()
    await element(by.id('FiatExchangeInput')).replaceText('$50')
    await element(by.id('FiatExchangeNextButton')).tap()
  })

  it('Should Display All Providers - US', async () => {
    // Check All Providers for US
    await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
    await expect(element(by.id('Provider/Simplex'))).toBeVisible()
    await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
    await expect(element(by.id('Provider/Ramp'))).toBeVisible()
    await expect(element(by.id('Provider/Transak'))).toBeVisible()
  })

  if (device.getPlatform() === 'ios') {
    // TODO(tomm) e2e tests for android
    it('Should Navigate to Simplex', async () => {
      await element(by.id('Provider/Simplex')).tap()
      await element(by.text('Continue to Simplex')).tap()
      await expect(element(by.type('WKContentView'))).toBeVisible()
    })

    it('Should Navigate to Transak', async () => {
      await element(by.id('Provider/Transak')).tap()
      await expect(element(by.type('WKContentView'))).toBeVisible()
    })
  }
}
