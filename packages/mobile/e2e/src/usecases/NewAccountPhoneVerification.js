import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, VERIFICATION_PHONE_NUMBER } from '@env'
import { dismissBanners } from '../utils/banners'
import { EXAMPLE_NAME, EXAMPLE_PHONE_NUMBER } from '../utils/consts'
import { checkKomenci } from '../utils/komenci'
import { checkBalance, receiveSms } from '../utils/twilio'
import { enterPinUi, setUrlDenyList, sleep, waitForElementId } from '../utils/utils'

const jestExpect = require('expect')
const examplePhoneNumber = VERIFICATION_PHONE_NUMBER || EXAMPLE_PHONE_NUMBER

export default NewAccountPhoneVerification = () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    // Enable url deny list
    await setUrlDenyList()

    // Dismiss banners for firebase warning
    await dismissBanners()

    // Proceed through education screens
    for (let i = 0; i < 3; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    // Create new account
    await element(by.id('CreateAccountButton')).tap()

    // Accept terms
    await element(by.id('scrollView')).scrollTo('bottom')
    await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()

    // Set name
    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
    await element(by.id('NameAndPictureContinueButton')).tap()

    // Set and verify pin
    await enterPinUi()
    await enterPinUi()

    // Set phone number
    await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    await element(by.id('PhoneNumberField')).replaceText(examplePhoneNumber)
    await element(by.id('PhoneNumberField')).tapReturnKey()
  })

  // Uninstall after to remove verification
  afterAll(async () => {
    device.uninstallApp()
  })

  // Check Twilio balance at start
  beforeAll(async () => {
    try {
      await checkBalance()
    } catch {}
  })

  // Check that Twilio SID, Auth Token and Verification Phone Number are defined
  // Check that Twilio balance is enought to complete tests
  if (
    TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN &&
    VERIFICATION_PHONE_NUMBER &&
    (async () => await checkBalance())
  ) {
    // Check status of 'https://staging-komenci.azurefd.net/v1/ready' prior to tests
    // If Komenci is up run phone verification
    // Else Verify that app handles Komenci being down appropriately
    if (async () => await checkKomenci()) {
      jest.retryTimes(2)
      it('Then should be able to verify phone number', async () => {
        // Start verification
        await element(by.text('Start')).tap()

        // Retrieve the verification codes from Twilio
        const codes = await receiveSms()

        // Wait for code input - 45 seconds max after we've received the last code
        await waitFor(element(by.id('VerificationCode0')))
          .toExist()
          .withTimeout(45 * 1000)

        // Check that we've received 3 codes
        console.log(codes)
        jestExpect(codes).toHaveLength(3)

        // Enter 3 codes
        for (let i = 0; i < 3; i++) {
          await waitFor(element(by.id(`VerificationCode${i}`)))
            .toBeVisible()
            .withTimeout(10 * 1000)
          await element(by.id(`VerificationCode${i}`)).replaceText(codes[i])
        }

        // Assert we've arrived at the home screen
        await waitFor(element(by.id('SendOrRequestBar')))
          .toBeVisible()
          .withTimeout(30 * 1000)

        // Assert that phone verification CTA is NOT served
        try {
          await element(by.id('CTA/ScrollContainer')).scroll(500, 'right')
        } catch {}
        await expect(element(by.text('Confirm Now'))).not.toExist()

        // Assert that correct phone number is present in sidebar
        await element(by.id('Hamburger')).tap()
        await expect(element(by.text(`${examplePhoneNumber}`))).toBeVisible()
      })
      jest.retryTimes(2)
      it('Then should be able to resend last 2 messages', async () => {
        // Start verification
        await element(by.text('Start')).tap()

        // Request codes, but wait for all 3 to verify resend codes work
        const codes = await receiveSms()
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

        // Enter pin to start resend
        await enterPinUi()
        let secondCodeSet = await receiveSms(2, 3 * 60 * 1000, codes)

        // Assert that we've received at least 2 codes
        jestExpect(secondCodeSet.length).toBeGreaterThanOrEqual(2)

        // Input codes two codes
        for (let i = 0; i < 2; i++) {
          await waitFor(element(by.id(`VerificationCode${i + 1}`)))
            .toBeVisible()
            .withTimeout(10 * 1000)
          await element(by.id(`VerificationCode${i + 1}`)).replaceText(secondCodeSet[i])
        }

        // Assert we've arrived at the home screen
        await waitFor(element(by.id('SendOrRequestBar')))
          .toBeVisible()
          .withTimeout(30 * 1000)

        // Assert that phone verification CTA is NOT served
        try {
          await element(by.id('CTA/ScrollContainer')).scroll(500, 'right')
        } catch {}
        await expect(element(by.text('Confirm Now'))).not.toExist()

        // Assert that correct phone number is present in sidebar
        await element(by.id('Hamburger')).tap()
        await expect(element(by.text(`${examplePhoneNumber}`))).toBeVisible()
      })
    } else {
      it('Then should handle when Komenci is down', async () => {
        // Continue To Komenci down view
        await element(by.text('Continue')).tap()

        // Continue to Home Screen
        await element(by.text('Continue')).tap()

        // Assert we've arrived at the home screen
        await waitFor(element(by.id('SendOrRequestBar')))
          .toBeVisible()
          .withTimeout(10 * 1000)

        // Assert that phone verification CTA is served
        try {
          await element(by.id('CTA/ScrollContainer')).scroll(500, 'right')
        } catch {}
        await expect(element(by.text('Confirm Now'))).toExist()

        // Assert that correct phone number is present in sidebar
        await element(by.id('Hamburger')).tap()
        await expect(element(by.text(`${examplePhoneNumber}`))).toBeVisible()
      })
    }
  }

  // This test is needed as a fall back if no previous tests run - empty specs are not allowed
  // Assert correct content is visible on the phone verification screen
  it('Then should have correct phone verification screen', async () => {
    await dismissBanners()
    await expect(element(by.text('Connect your phone number'))).toBeVisible()
    let skipAttributes = await element(by.text('Skip')).getAttributes()
    jestExpect(skipAttributes.enabled).toBe(true)
    await waitFor(element(by.text('Do I need to confirm?')))
      .toBeVisible()
      .withTimeout(10000)

    // Tap 'Do I need to confirm?' button
    await element(by.text('Do I need to confirm?')).tap()

    // Assert modal content is visible
    await expect(element(by.text('Phone Numbers and Valora'))).toBeVisible()
    await expect(
      element(
        by.text(
          'Confirming makes it easy to connect with your friends by allowing you to send and receive funds to your phone number.\n\nCan I do this later?\n\nYes, but unconfirmed accounts can only send payments with QR codes or Account Addresses.\n\nSecure and Private\n\nValora uses state of the art cryptography to keep your phone number private.'
        )
      )
    ).toBeVisible()

    // Assert able to dismiss modal and skip
    let modalDismissAttributes = await element(by.text('Dismiss')).getAttributes()
    jestExpect(modalDismissAttributes.enabled).toBe(true)
    await element(by.text('Dismiss')).tap()
    await element(by.text('Skip')).tap()

    // Assert modal contents of 'Are you Sure?' modal are visible
    await expect(element(by.text('Are you sure?'))).toBeVisible()
    await expect(
      element(
        by.text(
          'Confirming allows you to send and receive funds easily to your phone number.\n\nUnconfirmed accounts can only send payments using Celo addresses or QR codes.'
        )
      )
    ).toBeVisible()

    // Assert both options are enabled
    let goBackButtonAttributes = await element(by.text('Go Back')).getAttributes()
    let skipForNowButtonAttributes = await element(by.text('Skip for now')).getAttributes()
    jestExpect(goBackButtonAttributes.enabled).toBe(true)
    jestExpect(skipForNowButtonAttributes.enabled).toBe(true)

    // Tap 'Skip for now'
    await element(by.text('Skip for now')).tap()

    // Assert we've arrived at the home screen
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })
}
