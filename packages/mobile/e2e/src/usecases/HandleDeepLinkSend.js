import { quote, sleep, inputNumberKeypad } from '../utils/utils'
import { dismissBanners } from '../utils/banners'
import { reloadReactNative, launchApp } from '../utils/retries'

export default HandleDeepLinkSend = () => {
  let PAY_URL
  beforeAll(() => {
    PAY_URL = quote(
      'celo://wallet/pay?address=0x0b784e1cf121a2d9e914ae8bfe3090af0882f229&displayName=Crypto4BlackLives&e164PhoneNumber=%2B14046251530'
    )
  })

  it('Launch app cold with url', async () => {
    await device.terminateApp()
    await sleep(5000)
    await launchApp({ url: PAY_URL, newInstance: true })
    await sleep(5000)
    await dismissBanners()
    // Arrived at SendAmount screen
    await expect(element(by.id('Review'))).toBeVisible()

    // Enter amount and tap review
    await inputNumberKeypad('1.5')
    await element(by.id('Review')).tap()

    // Correct name displayed
    await expect(element(by.text('Crypto4BlackLives'))).toBeVisible()
  })

  it(':ios: Send url while app is in background, home pressed', async () => {
    await reloadReactNative()
    await device.sendToHome()
    await device.launchApp({ url: PAY_URL, newInstance: false })
  })

  // On Android there are two ways to "exit" the app
  // 1. home button
  // 2. back button
  // there is a slight but important difference because with the back button
  // the activity gets destroyed and listeners go away which can cause subtle bugs
  it.skip(':android: Send url while app is in background, back pressed', async () => {
    await reloadReactNative()
    await device.pressBack()
    await launchApp({ url: PAY_URL, newInstance: false })
    await expect(element(by.id('Review'))).toBeVisible()
  })

  // Skip on Android until we can have a firebase build on ci
  it(':ios: Send url while app is in foreground', async () => {
    await reloadReactNative()
    await device.openURL({ url: PAY_URL })
    await expect(element(by.id('Review'))).toBeVisible()
  })
}
