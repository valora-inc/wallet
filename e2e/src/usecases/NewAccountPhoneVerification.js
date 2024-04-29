import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  VERIFICATION_PHONE_NUMBER,
} from 'react-native-dotenv'
import { EXAMPLE_PHONE_NUMBER } from '../utils/consts'
import { launchApp } from '../utils/retries'
import { checkBalance, receiveSms } from '../utils/twilio'
import {
  completeProtectWalletScreen,
  enterPinUi,
  navigateToSettings,
  scrollIntoView,
  sleep,
  waitForElementId,
  waitForElementByIdAndTap,
} from '../utils/utils'

import jestExpect from 'expect'
const examplePhoneNumber = VERIFICATION_PHONE_NUMBER || EXAMPLE_PHONE_NUMBER

export default NewAccountPhoneVerification = () => {
  beforeEach(async () => {
    await launchApp({
      delete: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })

    // Create new account
    await element(by.id('CreateAccountButton')).tap()

    // Accept terms
    await element(by.id('scrollView')).scrollTo('bottom')
    await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()

    // Set and verify pin
    await enterPinUi()
    await enterPinUi()

    // Protect Wallet screen
    await completeProtectWalletScreen()

    // Set phone number
    await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    await element(by.id('PhoneNumberField')).replaceText(examplePhoneNumber)
    await element(by.id('PhoneNumberField')).tapReturnKey()
  })

  // Uninstall after to remove verification
  afterAll(async () => {
    device.uninstallApp()
  })

  // Check that Twilio SID, Auth Token and Verification Phone Number are defined
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && VERIFICATION_PHONE_NUMBER) {
    // Log Twilio balance at start
    beforeAll(async () => {
      try {
        await checkBalance()
      } catch {}
    })

    // Conditionally skipping jest tests with an async request is currently not possible
    // https://github.com/facebook/jest/issues/7245
    // https://github.com/facebook/jest/issues/11489
    // Either fix or move to nightly tests when present
    // Also needs to be updated to work against tab navigation instead of drawer
    // jest.retryTimes(1)
    it.skip('Then should be able to verify phone number', async () => {
      // Get Date at start
      let date = new Date()
      // Start verification
      await element(by.text('Start')).tap()

      // Retrieve the verification codes from Twilio
      const codes = await receiveSms(date)

      // Check that we've received 3 codes
      jestExpect(codes).toHaveLength(3)

      // Enter 3 codes
      for (let i = 0; i < 3; i++) {
        await sleep(1000)
        await waitFor(element(by.id(`VerificationCode${i}`)))
          .toBeVisible()
          .withTimeout(30 * 1000)
        await element(by.id(`VerificationCode${i}`)).typeText(codes[i])
      }

      // Choose your own adventure (CYA screen)
      await waitForElementByIdAndTap('ChooseYourAdventure/Later')

      // Assert we've arrived at the home screen
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(45 * 1000)

      // Assert that correct phone number is present in sidebar
      await waitForElementId('Hamburger')
      await element(by.id('Hamburger')).tap()
      await expect(element(by.text(`${examplePhoneNumber}`))).toBeVisible()

      // Assert that 'Connect phone number' is not present in settings
      await scrollIntoView('Settings', 'SettingsScrollView')
      await waitFor(element(by.id('Settings')))
        .toBeVisible()
        .withTimeout(30000)
      await element(by.id('Settings')).tap()
      await expect(element(by.text('Connect phone number'))).not.toBeVisible()
    })

    // Note: (Tom) Skip this test until we have a nightly suite vs pull request suite as it takes a long time
    // jest.retryTimes(1)
    it.skip('Then should be able to resend last 2 messages', async () => {
      // Get Date at start
      let date = new Date()
      // Start verification
      await element(by.text('Start')).tap()

      // Request codes, but wait for all 3 to verify resend codes work
      const codes = await receiveSms(date)
      await waitFor(element(by.id('VerificationCode0')))
        .toExist()
        .withTimeout(45 * 1000)

      // Assert that we've received 3 codes
      jestExpect(codes).toHaveLength(3)

      // Input first code
      await element(by.id(`VerificationCode0`)).replaceText(codes[0])

      // Wait one minute before resending
      await sleep(60 * 1000)
      await element(by.text('Resend 2 messages')).tap()

      // Set date and enter pin to start resend
      date = new Date()
      await enterPinUi()
      let secondCodeSet = await receiveSms(date, 2, codes)

      // Assert that we've received at least 2 codes
      jestExpect(secondCodeSet.length).toBeGreaterThanOrEqual(2)

      // Input codes two codes
      for (let i = 0; i < 2; i++) {
        await waitFor(element(by.id(`VerificationCode${i + 1}`)))
          .toBeVisible()
          .withTimeout(10 * 1000)
        await element(by.id(`VerificationCode${i + 1}`)).replaceText(secondCodeSet[i])
      }

      // Choose your own adventure (CYA screen)
      await waitForElementByIdAndTap('ChooseYourAdventure/Later')

      // Assert we've arrived at the home screen
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30 * 1000)

      // Assert that correct phone number is present in sidebar
      await waitForElementId('Hamburger')
      await element(by.id('Hamburger')).tap()
      await expect(element(by.text(`${examplePhoneNumber}`))).toBeVisible()

      // Assert that 'Connect phone number' is not present in settings
      await scrollIntoView('Settings', 'SettingsScrollView')
      await waitFor(element(by.id('Settings')))
        .toBeVisible()
        .withTimeout(30 * 1000)
      await element(by.id('Settings')).tap()
      await expect(element(by.text('Connect phone number'))).not.toBeVisible()
    })
  }

  // Assert correct content is visible on the phone verification screen
  it('Then should have correct phone verification screen', async () => {
    await expect(element(by.id('PhoneVerificationHeader'))).toBeVisible()
    let skipAttributes = await element(by.text('Skip')).getAttributes()
    jestExpect(skipAttributes.enabled).toBe(true)

    // Tap 'Skip'
    await element(by.text('Skip')).tap()

    // Choose your own adventure (CYA screen)
    await waitForElementByIdAndTap('ChooseYourAdventure/Later')

    // Assert we've arrived at the home screen
    await waitForElementId('HomeAction-Send')

    // Assert that 'Connect phone number' is present in settings
    await navigateToSettings()
    await waitFor(element(by.text('Connect phone number')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })
}
