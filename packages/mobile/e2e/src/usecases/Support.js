import { dismissBanners } from '../utils/banners'
import { pixelDiff, scrollIntoView, getDeviceModel } from '../utils/utils'
import { reloadReactNative } from '../utils/retries'

export default Support = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await dismissBanners()
  })

  if (device.getPlatform() === 'ios') {
    it("Display 'Contact' on Shake", async () => {
      await device.shake()
      await waitFor(element(by.id('HavingTrouble')))
        .toBeVisible()
        .withTimeout(5000)
      await waitFor(element(by.id('ShakeForSupport')))
        .toBeVisible()
        .withTimeout(5000)
      await element(by.id('ContactSupportFromShake')).tap()
      await waitFor(element(by.id('ContactTitle')))
        .toBeVisible()
        .withTimeout(5000)
      await waitFor(element(by.id('MessageEntry')))
        .toBeVisible()
        .withTimeout(5000)
      await expect(element(by.id('SwitchLogs'))).toHaveToggleValue(true)
      // TODO: enable when branding is present
      // await expect(element(by.id('Legal'))).toHaveText(
      //   'By submitting, I agree to share the above information and any attached application log data with Valora Support.'
      // )
    })
  }

  it('Send Message to Support', async () => {
    await waitFor(element(by.id('Hamburger')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Help', 'SettingsScrollView')
    await waitFor(element(by.id('Help')))
      .toExist()
      .withTimeout(5000)
    await element(by.id('Help')).tap()
    await waitFor(element(by.id('SupportContactLink')))
      .toExist()
      .withTimeout(5000)
    await element(by.id('SupportContactLink')).tap()
    await waitFor(element(by.id('MessageEntry')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('MessageEntry')).tap()
    await element(by.id('MessageEntry')).typeText('This is a test from Valora')
    await expect(element(by.id('MessageEntry'))).toHaveText('This is a test from Valora')
    const imagePath = await device.takeScreenshot('Support')
    await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/Support.png`)
  })
}
