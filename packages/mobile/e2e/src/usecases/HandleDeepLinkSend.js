import { quote, sleep, inputNumberKeypad, enterPinUiIfNecessary } from '../utils/utils'
import { dismissBanners } from '../utils/banners'
import { reloadReactNative, launchApp } from '../utils/retries'

export default HandleDeepLinkSend = () => {
  const PAY_URL = quote(
    'celo://wallet/pay?address=0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846&displayName=TestFaucet'
  )

  it.todo('Then handles amount (optional)')

  it.todo('Then handles comment (optional)')

  it.todo('Then handles token (optional)')

  it.todo('Then handles amount (optional)')

  it.todo('Then handles currencyCode (optional)')

  it.todo('Then errors if address (required) not provided')

  it('Launch app cold with url - amount included', async () => {
    const PAY_AMOUNT_URL = quote(
      'celo://wallet/pay?address=0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846&displayName=TestFaucet&currencyCode=KES&amount=0.1&comment='
    )
    await device.terminateApp()
    await sleep(5000)
    await launchApp({ url: PAY_AMOUNT_URL, newInstance: true })
    await sleep(5000)
    await dismissBanners()
    // Correct name displayed
    await expect(element(by.text('TestFaucet'))).toBeVisible()

    // Tap Pay
    await element(by.id('ConfirmButton')).tap()

    // Enter pin
    await enterPinUiIfNecessary()

    // Arrived to Home screen
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
  })

  it('Launch app cold with url - enter amount', async () => {
    await device.terminateApp()
    await sleep(5000)
    await launchApp({ url: PAY_URL, newInstance: true })
    await sleep(5000)
    await dismissBanners()
    // Arrived at SendAmount screen
    await expect(element(by.id('Review'))).toBeVisible()

    // Enter amount and tap review
    await inputNumberKeypad('0.1')
    await element(by.id('Review')).tap()

    // Correct name displayed
    await expect(element(by.text('TestFaucet'))).toBeVisible()

    // Tap Send
    await element(by.id('ConfirmButton')).tap()

    // Enter pin
    await enterPinUiIfNecessary()

    // Arrived to Home screen
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
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
