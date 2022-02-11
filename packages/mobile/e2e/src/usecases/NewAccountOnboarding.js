import { enterPinUi, setUrlDenyList, sleep } from '../utils/utils'
import { EXAMPLE_NAME } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
import { launchApp } from '../utils/retries'

// seedrandom(deviceUUID1)() is smaller than 0.5
// seedrandom(deviceUUID2)() is greater than 0.5
const deviceUUID1 = '7646fb0d146383e8'
const deviceUUID2 = 'ec3789a252e2cb17'

export default NewAccountOnboarding = () => {
  beforeAll(async () => {
    await device.terminateApp()
    await sleep(5000)
    await launchApp({
      delete: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await setUrlDenyList()
    await sleep(5000)
    await dismissBanners()
  })

  // One of the following two test cases should be deleted upon completion of the onboarding education screen experiments
  // Math.random() is mocked here because the experiment was controlled by Math.random in Navigator.tsx
  it('Create a new account (with onboarding education screens skipped)', async () => {
    jest.mock('react-native-device-info', () => ({
      getUniqueId: jest.fn(() => deviceUUID1),
    }))
    await element(by.id('CreateAccountButton')).tap()

    // Accept Terms
    await element(by.id('scrollView')).scrollTo('bottom')
    await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()

    // Set name and number
    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
    await element(by.id('NameAndPictureContinueButton')).tap()

    // Set & Verify pin
    await enterPinUi()
    await enterPinUi()

    // Dismiss banners if present
    await dismissBanners()

    // Skip Phone Number verification
    await element(by.id('VerificationEducationSkipHeader')).tap()
    await element(by.id('VerificationSkipDialog/PrimaryAction')).tap()

    // Arrived to Home screen
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()

    jest.unmock('react-native-device-info')
  })

  it('Create a new account (without onboarding education screens skipped)', async () => {
    jest.mock('react-native-device-info', () => ({
      getUniqueId: jest.fn(() => deviceUUID2),
    }))

    // Onboarding education has 3 steps
    for (let i = 0; i < 3; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    await element(by.id('CreateAccountButton')).tap()

    // Accept Terms
    await element(by.id('scrollView')).scrollTo('bottom')
    await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()

    // Set name and number
    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
    await element(by.id('NameAndPictureContinueButton')).tap()

    // Set & Verify pin
    await enterPinUi()
    await enterPinUi()

    // Dismiss banners if present
    await dismissBanners()

    // Skip Phone Number verification
    await element(by.id('VerificationEducationSkipHeader')).tap()
    await element(by.id('VerificationSkipDialog/PrimaryAction')).tap()

    // Arrived to Home screen
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()

    jest.unmock('react-native-device-info')
  })

  // Ideally this wouldn't be dependent on the previous test
  it('Setup Recovery Phrase', async () => {
    await element(by.id('Hamburger')).tap()
    await element(by.id('DrawerItem/Recovery Phrase')).tap()

    await enterPinUi()

    await element(by.id('SetUpAccountKey')).tap()

    // Go through education
    for (let i = 0; i < 4; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    await expect(element(by.id('AccountKeyWords'))).toBeVisible()

    const attributes = await element(by.id('AccountKeyWords')).getAttributes()
    const accountKey = attributes.text

    await element(by.id('backupKeySavedSwitch')).longPress()
    await element(by.id('backupKeyContinue')).tap()
    for (const word of accountKey.split(' ')) {
      await element(by.id(`backupQuiz/${word}`)).tap()
    }
    await element(by.id('QuizSubmit')).tap()

    // Backup complete screen is served
    await waitFor(element(by.id('BackupComplete')))
      .toBeVisible()
      .withTimeout(10 * 1000)

    // Navigated to recovery phrase display
    await waitFor(element(by.id('RecoveryPhraseContainer')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })
}
