import { reloadReactNative, launchApp } from '../utils/retries'
import { scrollIntoView, waitForElementId, waitForElementByIdAndTap } from '../utils/utils'

export default Support = () => {
  beforeEach(async () => {
    await reloadReactNative()
  })

  if (device.getPlatform() === 'ios') {
    jest.retryTimes(2)
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

  jest.retryTimes(2)
  it('Send Message to Support (drawer)', async () => {
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Help', 'SettingsScrollView')
    await waitFor(element(by.id('Help')))
      .toExist()
      .withTimeout(10000)
    await element(by.id('Help')).tap()
    await waitFor(element(by.id('SupportContactLink')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('SupportContactLink')).tap()
    await waitFor(element(by.id('MessageEntry')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('MessageEntry')).tap()
    await element(by.id('MessageEntry')).typeText('This is a test from Valora')
    await expect(element(by.id('MessageEntry'))).toHaveText('This is a test from Valora')
  })

  it('Send Message to Support (tab)', async () => {
    await launchApp({
      newInstance: false,
      permissions: { notifications: 'YES', contacts: 'YES' },
      launchArgs: { statsigGateOverrides: `use_tab_navigator=true` },
    })
    await waitForElementByIdAndTap('WalletHome/AccountCircle')
    await waitForElementByIdAndTap('ProfileMenu/Help')
    await waitFor(element(by.id('SupportContactLink')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('SupportContactLink')).tap()
    await waitFor(element(by.id('MessageEntry')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('MessageEntry')).tap()
    await element(by.id('MessageEntry')).typeText('This is a test from Valora')
    await expect(element(by.id('MessageEntry'))).toHaveText('This is a test from Valora')
  })
}
