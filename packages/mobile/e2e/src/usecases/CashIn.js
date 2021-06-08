import { dismissBanners } from '../utils/banners'
import { pixelDiff, sleep } from '../utils/utils'

export default CashIn = () => {
  beforeAll(async () => {
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await element(by.id('addFunds')).tap()
    await element(by.id('GoToProviderButton')).tap()
    await element(by.id('FiatExchangeInput')).replaceText('$50')
    await element(by.id('FiatExchangeNextButton')).tap()
  })

  beforeEach(async () => {
    await device.sendToHome()
    await device.launchApp({ newInstance: false })
    // TODO: If on Simplex Press Back Button
  })

  it('Should Display All Providers #BVT', async () => {
    // Check All Providers for US
    await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
    await expect(element(by.id('Provider/Simplex'))).toBeVisible()
    await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
    await expect(element(by.id('Provider/Ramp'))).toBeVisible()
    await expect(element(by.id('Provider/Transak'))).toBeVisible()
    await sleep(5000)
    const imagePath = await device.takeScreenshot('All Providers US')
    await pixelDiff(
      imagePath,
      device.getPlatform() === 'ios'
        ? './e2e/assets/All Providers US - ios.png'
        : './e2e/assets/All Providers US - android.png'
    )
  })

  // TODO: Check providers on Android
  if (device.getPlatform() === 'ios') {
    it('Should Navigate to Moonpay', async () => {
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

    it('Should Navigate to Xanpool', async () => {
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

    it('Should Navigate to Transak', async () => {
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

  // Check Simplex keep test spec last in use case
  // TODO: setup back method in beforeEach if on Simplex view
  it.skip('Should Navigate to Simplex', async () => {
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
}
