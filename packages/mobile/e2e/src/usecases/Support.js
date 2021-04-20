import errorDismiss from '../utils/banners'

export default Support = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await errorDismiss()
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
      // TODO(Tom): Find a better selector
      // await expect(element(by.id('Legal'))).toHaveText('By submitting, I agree to share the above information and any attached application log data with Valora Support.');
    })
  }

  it('Send message to support', async () => {
    await element(by.id('Hamburguer')).tap()
    await waitFor(element(by.id('Help')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('Help')).tap()
    await element(by.id('SupportContactLink')).tap()
    await waitFor(element(by.id('MessageEntry')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('MessageEntry')).replaceText('This is a test - 🧪')
    await expect(element(by.id('MessageEntry'))).toHaveText('This is a test - 🧪')
    // TODO: Send Request after briefing support if appropriate
  })
}
