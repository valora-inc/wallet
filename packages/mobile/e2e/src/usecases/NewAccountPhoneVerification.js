import { sleep, enterPinUi, waitForElementId } from '../utils/utils'
import { EXAMPLE_NAME, VERIFICATION_PHONE_NUMBER } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
import { receiveSms } from '../utils/twilio'
import { checkKomenci } from '../utils/komenci'
const jestExpect = require('expect')

export default NewAccountPhoneVerification = () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await dismissBanners()

    // Setup To Verification
    // Proceed Through Education Screens
    for (let i = 0; i < 3; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    // Create New Account
    await element(by.id('CreateAccountButton')).tap()

    // Accept Terms
    await element(by.id('scrollView')).scrollTo('bottom')
    await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()

    // Set name
    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
    await element(by.id('NameAndPictureContinueButton')).tap()

    // Set and Verify Pin
    await enterPinUi()
    await enterPinUi()

    // Set phone number
    await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    await element(by.id('PhoneNumberField')).replaceText(VERIFICATION_PHONE_NUMBER)
  })

  // Check status of 'https://staging-komenci.azurefd.net/v1/ready' prior to tests
  // If Komenci is up run phone verification
  // Else Verify that App handles Komenci being down appropriately
  if (async () => await checkKomenci()) {
    it('Then should be able to verify phone number', async () => {
      // TODO why do we need two taps here?
      await element(by.text('Start')).tap()
      await element(by.text('Start')).tap()

      // Write the verification codes.
      const codes = await receiveSms()

      // Wait for code input - 30 seconds max after we've received the last code
      await waitFor(element(by.id('VerificationCode0')))
        .toExist()
        .withTimeout(45000)

      // Check that we've received 3 codes
      jestExpect(codes).toHaveLength(3)

      // Enter 3 codes
      for (let i = 0; i < 3; i++) {
        await element(by.id(`VerificationCode${i}`)).replaceText(codes[i])
      }

      // Skip contacts
      await waitForElementId('ImportContactsSkip')
      await element(by.id('ImportContactsSkip')).tap()

      // Arrived to the Home screen
      await waitFor(element(by.id('SendOrRequestBar')))
        .toBeVisible()
        .withTimeout(10000)

      // Verify that phone verification CTA is NOT served
      try {
        await element(by.id('CTA/ScrollContainer')).scroll(500, 'right')
      } catch {}
      await expect(element(by.text('Confirm Now'))).not.toExist()

      // Check Phone Number is Present
      await element(by.id('Hamburger')).tap()
      await expect(element(by.text(VERIFICATION_PHONE_NUMBER))).toBeVisible()
    })

    it('Then should be able to resend last 2 messages', async () => {
      // TODO why do we need two taps here?
      await element(by.text('Start')).tap()
      await element(by.text('Start')).tap()

      // Request codes, but wait for all 3 to verify resend codes work
      const codes = await receiveSms()
      await waitFor(element(by.id('VerificationCode0')))
        .toExist()
        .withTimeout(45000)
      await element(by.id(`VerificationCode0`)).replaceText(codes[0])

      // Wait One minute before resending
      await sleep(60000)
      await element(by.text('Resend 2 messages')).tap()

      // Enter Pin to start resend
      await enterPinUi()
      let secondCodeSet = await receiveSms(2, 2 * 60 * 1000, codes)
      for (let i = 0; i < 2; i++) {
        await element(by.id(`VerificationCode${i + 1}`)).replaceText(secondCodeSet[i])
      }

      // Skip contacts
      await waitForElementId('ImportContactsSkip')
      await element(by.id('ImportContactsSkip')).tap()

      // Arrived to the Home screen
      await waitFor(element(by.id('SendOrRequestBar')))
        .toBeVisible()
        .withTimeout(10000)

      // Verify that phone verification CTA is NOT served
      try {
        await element(by.id('CTA/ScrollContainer')).scroll(500, 'right')
      } catch {}
      await expect(element(by.text('Confirm Now'))).not.toExist()

      // Check Phone Number is Present
      await element(by.id('Hamburger')).tap()
      await expect(element(by.text(VERIFICATION_PHONE_NUMBER))).toBeVisible()
    })
  } else {
    it('Then should handle when Komenci is down', async () => {
      // Continue To Komenci down view
      await element(by.text('Continue')).tap()

      // TODO: Verify Komenci Down Screen Served
      // Continue to Home Screen
      await element(by.text('Continue')).tap()

      // Arrived to the Home screen
      await waitFor(element(by.id('SendOrRequestBar')))
        .toBeVisible()
        .withTimeout(10000)

      // Verify that phone verification CTA is served
      try {
        await element(by.id('CTA/ScrollContainer')).scroll(500, 'right')
      } catch {}
      await expect(element(by.text('Confirm Now'))).toExist()

      // Check Phone Number is Present
      await element(by.id('Hamburger')).tap()
      await expect(element(by.text(VERIFICATION_PHONE_NUMBER))).toBeVisible()
    })
  }
}
