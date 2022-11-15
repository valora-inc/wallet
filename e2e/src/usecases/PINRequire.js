import { scrollIntoView, waitForElementId } from '../utils/utils'
import { reloadReactNative } from '../utils/retries'

export default RequirePIN = () => {
  it('Then should be require PIN on app open', async () => {
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitForElementId('Settings')
    await element(by.id('Settings')).tap()
    // Request Pin on App Open disabled by default
    await element(by.id('requirePinOnAppOpenToggle')).tap()
    await expect(element(by.id('requirePinOnAppOpenToggle'))).toHaveToggleValue(true)
    // Reload to simulate new app load from background
    await reloadReactNative()
    // Check that PIN is required
    await expect(element(by.text('Enter PIN'))).toBeVisible()
  })
}
