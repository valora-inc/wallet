import { dismissBanners } from '../utils/banners'
import { pixelDiff, setDemoMode, scrollIntoView } from '../utils/utils'

export default Support = () => {
  beforeAll(async () => {
    await setDemoMode()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
  })

  if (device.getPlatform() === 'ios') {
    it("Display 'Contact' on Shake", async () => {
      await device.shake()
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
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Help', 'SettingsScrollView')
    await waitFor(element(by.id('Help')))
      .toExist()
      .withTimeout(5000)
    await element(by.id('Help')).tap()
    await element(by.id('SupportContactLink')).tap()
    await waitFor(element(by.id('MessageEntry')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('MessageEntry')).tap()
    await element(by.id('MessageEntry')).typeText('This is a test from cLabs')
    await expect(element(by.id('MessageEntry'))).toHaveText('This is a test from cLabs')
    const imagePath = await device.takeScreenshot('Support')
    pixelDiff(
      imagePath,
      device.getPlatform() === 'ios'
        ? './e2e/assets/Support - ios.png'
        : './e2e/assets/Support - android.png'
    )
    // TODO: Email Client needed for emulators Send Request after briefing support if appropriate
  })
}
