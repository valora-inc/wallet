import { dismissBanners } from '../utils/banners'
import { pixelDiff, setDemoMode, sleep } from '../utils/utils'

export default CashIn = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await setDemoMode()
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
    await sleep(5000)
    const imagePath = await device.takeScreenshot('All Providers US')
    pixelDiff(
      imagePath,
      device.getPlatform() === 'ios'
        ? './e2e/assets/All Providers US - ios.png'
        : './e2e/assets/All Providers US - android.png'
    )
  })

  // These Tests are Flaky on Android at Present - Emulator Needs an Update
  if (device.getPlatform() === 'ios') {
    it('Should Navigate to Simplex', async () => {
      await element(by.id('Provider/Simplex')).tap()
      await element(by.text('Continue to Simplex')).tap()
      //TODO: find element to implicitly wait on
      await sleep(5000)
      const imagePath = await device.takeScreenshot('Simplex')
      pixelDiff(
        imagePath,
        device.getPlatform() === 'ios'
          ? './e2e/assets/Simplex - ios.png'
          : './e2e/assets/Simplex - android.png'
      )
    })

    it('Should Navigate to Transak', async () => {
      await element(by.id('Provider/Transak')).tap()
      //TODO: find element to implicitly wait on
      await sleep(5000)
      const imagePath = await device.takeScreenshot('Transak')
      pixelDiff(
        imagePath,
        device.getPlatform() === 'ios'
          ? './e2e/assets/Transak - ios.png'
          : './e2e/assets/Transak - android.png'
      )
    })
  }
}
