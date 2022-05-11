import { dismissBanners } from '../utils/banners'
import { reloadReactNative } from '../utils/retries'
import { scrollIntoView, sleep } from '../utils/utils'
const faker = require('@faker-js/faker')

export default Settings = () => {
  beforeEach(async () => {
    await reloadReactNative()
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
    await expect(element(by.text('Your name and picture were saved successfully.'))).toBeVisible()
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    // TODO replace this with an ID selector
    await expect(element(by.text(`${randomName}`))).toBeVisible()
  })
}
