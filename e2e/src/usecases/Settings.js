import { sleep } from '../../../src/utils/sleep'
import { dismissBanners } from '../utils/banners'
import { reloadReactNative } from '../utils/retries'
import {
  navigateToPreferences,
  navigateToProfile,
  scrollIntoView,
  waitForElementByIdAndTap,
} from '../utils/utils'

const faker = require('@faker-js/faker')

export default Settings = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await sleep(3000)
  })

  // mobilestack: no profile support
  it.skip('Edit Profile Name', async () => {
    let randomName = faker.lorem.words()
    await navigateToProfile()
    await element(by.id('ProfileSubmenu/EditProfile')).tap()
    await element(by.id('ProfileEditName')).tap()
    await element(by.id('ProfileEditName')).clearText()
    await element(by.id('ProfileEditName')).replaceText(`${randomName}`)
    await scrollIntoView('SaveButton', 'ProfileScrollView')
    await element(by.id('SaveButton')).tap()
    await waitFor(element(by.text('Your name was saved successfully.')))
      .toBeVisible()
      .withTimeout(1000 * 10)
    await dismissBanners()
    await waitForElementByIdAndTap('BackChevron')
    // TODO replace this with an ID selector
    await expect(element(by.text(`${randomName}`))).toBeVisible()
  })

  it('Change Language', async () => {
    await navigateToPreferences()
    await element(by.id('PreferencesSubmenu/Language')).tap()
    await element(by.id('ChooseLanguage/es-419')).tap()
    await waitFor(element(by.id('CustomHeaderTitle')))
      .toHaveText('Preferencias')
      .withTimeout(1000 * 15)
    await element(by.id('PreferencesSubmenu/Language')).tap()
    await element(by.id('ChooseLanguage/en-US')).tap()
    await waitFor(element(by.id('CustomHeaderTitle')))
      .toHaveText('Preferences')
      .withTimeout(1000 * 15)
  })

  it('Change Currency', async () => {
    await navigateToPreferences()
    await element(by.id('PreferencesSubmenu/ChangeCurrency')).tap()
    await element(by.id('SelectLocalCurrency/AUD')).tap()
    await waitFor(element(by.text('AUD')))
      .toBeVisible()
      .withTimeout(1000 * 15)
    await element(by.id('PreferencesSubmenu/ChangeCurrency')).tap()
    await scrollIntoView('USD', 'SelectLocalCurrencyScrollView')
    await element(by.id('SelectLocalCurrency/USD')).tap()
    await waitFor(element(by.text('USD')))
      .toBeVisible()
      .withTimeout(1000 * 15)
  })
}
