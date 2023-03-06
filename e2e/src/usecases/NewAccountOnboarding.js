import { EXAMPLE_NAME } from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  dismissCashInBottomSheet,
  enterPinUi,
  scrollIntoView,
  sleep,
  waitForElementId,
  quickOnboarding,
} from '../utils/utils'
import { getAddressChunks } from '@celo/utils/lib/address'

const jestExpect = require('expect')

export default NewAccountOnboarding = () => {
  let testRecoveryPhrase, testAccountAddress
  beforeAll(async () => {
    await device.terminateApp()
    await sleep(5000)
    await launchApp({
      delete: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await sleep(5000)
  })

  it('Create a new account', async () => {
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

    // Skip Phone Number verification
    await element(by.id('PhoneVerificationSkipHeader')).tap()

    // Arrived to Home screen
    await dismissCashInBottomSheet()
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()

    // Able to open the drawer - testing https://github.com/valora-inc/wallet/issues/3043
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await waitForElementId('Drawer/Header')
  })

  // Ideally this wouldn't be dependent on the previous test
  it('Setup Recovery Phrase', async () => {
    await element(by.id('DrawerItem/Recovery Phrase')).tap()
    await enterPinUi()
    await element(by.id('SetUpAccountKey')).tap()

    // Go through education
    for (let i = 0; i < 4; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    await expect(element(by.id('AccountKeyWordsContainer'))).toBeVisible()

    const attributes = await element(by.id('AccountKeyWordsContainer')).getAttributes()
    testRecoveryPhrase = attributes.label

    await element(by.id('backupKeySavedSwitch')).longPress()
    await element(by.id('backupKeyContinue')).tap()
    for (const word of testRecoveryPhrase.split(' ')) {
      await element(by.id(`backupQuiz/${word}`)).tap()
    }
    await element(by.id('QuizSubmit')).tap()

    // Backup complete screen is served
    await waitFor(element(by.id('BackupComplete')))
      .toBeVisible()
      .withTimeout(10 * 1000)

    // Navigated to Home screen
    await dismissCashInBottomSheet()
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('Account Address shown in drawer menu', async () => {
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Account Address', 'SettingsScrollView')
    const accountAddressElement = await element(by.id('AccountNumber')).getAttributes()
    const accountAddressText = accountAddressElement.text.replace(/\s/g, '')
    testAccountAddress = accountAddressText
    jestExpect(testAccountAddress).toMatch(/0x[0-9a-fA-F]{40}/)
  })

  // After quiz completion recovery phrase should only be shown in settings
  it('Recovery phrase only shown in settings', async () => {
    await expect(element(by.id('DrawerItem/Recovery Phrase'))).not.toExist()
    await waitForElementId('DrawerItem/Settings')
    await element(by.id('DrawerItem/Settings')).tap()
    await waitForElementId('RecoveryPhrase')
    await element(by.id('RecoveryPhrase')).tap()
    await enterPinUi()
    await waitForElementId('AccountKeyWordsContainer')
  })

  // Based off the flag set in src/firebase/remoteConfigValuesDefaults.e2e.ts
  // We can only test one path 12 or 24 words as we cannot flip the flag after the build step
  it('Recovery phrase has 12 words', async () => {
    const recoveryPhraseContainer = await element(by.id('AccountKeyWordsContainer')).getAttributes()
    const recoveryPhraseText = extractRecoveryPhrase(recoveryPhraseContainer.label)
    jestExpect(recoveryPhraseText.split(' ').length).toBe(12)
    jestExpect(recoveryPhraseText).toBe(testRecoveryPhrase)
  })

  it('Should be able to restore newly created account', async () => {
    await device.uninstallApp()
    await device.installApp()
    await launchApp()
    await quickOnboarding(testRecoveryPhrase)
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await scrollIntoView('Account Address', 'SettingsScrollView')
    const addressString = '0x ' + getAddressChunks(testAccountAddress).join(' ')
    await expect(element(by.text(addressString))).toBeVisible()
  })
}
