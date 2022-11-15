import { dismissBanners } from '../utils/banners'
import { reloadReactNative } from '../utils/retries'
import { scrollIntoView, sleep, waitForElementId } from '../utils/utils'
const faker = require('@faker-js/faker')

export default Settings = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('Settings')).tap()
    await sleep(3000)
  })

  it('Edit Profile Name', async () => {
    let randomName = faker.lorem.words()
    await element(by.id('EditProfile')).tap()
    await element(by.id('ProfileEditName')).tap()
    await element(by.id('ProfileEditName')).clearText()
    await element(by.id('ProfileEditName')).replaceText(`${randomName}`)
    await element(by.id('SaveButton')).tap()
    await waitFor(element(by.text('Your name and picture were saved successfully.')))
      .toBeVisible()
      .withTimeout(1000 * 10)
    await dismissBanners()
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    // TODO replace this with an ID selector
    await expect(element(by.text(`${randomName}`))).toBeVisible()
  })

  it('Change Language', async () => {
    await element(by.id('ChangeLanguage')).tap()
    await element(by.id('ChooseLanguage/es-419')).tap()
    await waitFor(element(by.id('SettingsTitle')))
      .toHaveText('Configuración')
      .withTimeout(1000 * 15)
    await element(by.id('ChangeLanguage')).tap()
    await element(by.id('ChooseLanguage/en-US')).tap()
    await waitFor(element(by.id('SettingsTitle')))
      .toHaveText('Settings')
      .withTimeout(1000 * 15)
  })

  it('Change Currency', async () => {
    await element(by.id('ChangeCurrency')).tap()
    await element(by.id('SelectLocalCurrency/AUD')).tap()
    await waitFor(element(by.text('AUD')))
      .toBeVisible()
      .withTimeout(1000 * 15)
    await element(by.id('ChangeCurrency')).tap()
    await scrollIntoView('USD', 'SelectLocalCurrencyScrollView')
    await element(by.id('SelectLocalCurrency/USD')).tap()
    await waitFor(element(by.text('USD')))
      .toBeVisible()
      .withTimeout(1000 * 15)
  })
}
