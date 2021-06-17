import { sleep, enterPinUi } from '../utils/utils'
import { EXAMPLE_NAME, VERIFICATION_PHONE_NUMBER } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
import { receiveSms } from '../utils/twilio'

export default NewAccountPhoneVerification = () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await sleep(5000)
    await dismissBanners()
  })

  it('Verify Phone Number', async () => {
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
    await element(by.text('Start')).tap()
    await element(by.text('Start')).tap()

    // Write the verification codes.
    const codes = await receiveSms()
    for (let i = 0; i < 3; i++) {
      await element(by.id(`VerificationCode${i}`)).replaceText(codes[i])
    }

    // Skip contacts
    await waitForElementId('ImportContactsSkip')
    await element(by.id('ImportContactsSkip')).tap()

    // Arrived to the Home screen!
    await sleep(3000)
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
  })
}
