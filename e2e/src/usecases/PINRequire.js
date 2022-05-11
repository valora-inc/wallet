import { scrollIntoView } from '../utils/utils'
import { reloadReactNative } from '../utils/retries'

export default RequirePIN = () => {
  beforeEach(async () => {
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('Settings')).tap()
  })

  it('Then should be require PIN on app open', async () => {
    // Request Pin on App Open disabled by default
    await element(by.id('requirePinOnAppOpenToggle')).tap()
    await expect(element(by.id('requirePinOnAppOpenToggle'))).toHaveToggleValue(true)
    // Reload to simulate new app load from background
    await reloadReactNative()
    // Check that PIN is required
    await expect(element(by.text('Enter PIN'))).toBeVisible()
  })
}
