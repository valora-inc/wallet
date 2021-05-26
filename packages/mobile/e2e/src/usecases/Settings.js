import { dismissBanners } from '../utils/banners'
import { scrollIntoView, sleep } from '../utils/utils'
var faker = require('faker')

export default Settings = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('Settings')).tap()
    await sleep(3000)
  })

  it('Edit Profile Name', async () => {
    const randomName = faker.lorem.words()
    await element(by.id('EditProfile')).tap()
    await element(by.id('ProfileEditName')).tap()
    await element(by.id('ProfileEditName')).clearText()
    await element(by.id('ProfileEditName')).replaceText(`${randomName}`)
    await element(by.id('SaveButton')).tap()
    await expect(element(by.id('SmartTopAlertTouchable'))).toBeVisible()
    await element(by.id('SmartTopAlertTouchable')).tap()
    await element(by.id('Hamburger')).tap()
    // TODO replace this with an ID selector
    await expect(element(by.text(`${randomName}`))).toBeVisible()
  })
}
