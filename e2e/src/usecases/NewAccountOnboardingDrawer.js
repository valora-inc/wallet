import { getAddressChunks } from '@celo/utils/lib/address'
import { launchApp } from '../utils/retries'
import {
  completeProtectWalletScreen,
  enterPinUi,
  quickOnboarding,
  scrollIntoView,
  sleep,
  waitForElementByIdAndTap,
  waitForElementId,
} from '../utils/utils'

import jestExpect from 'expect'

const quickEducation = async () => {
  await element(by.id('DrawerItem/Recovery Phrase')).tap()
  await enterPinUi()
  await element(by.id('SetUpAccountKey')).tap()

  // Go through education
  for (let i = 0; i < 4; i++) {
    await element(by.id('Education/progressButton')).tap()
  }

  await expect(element(by.id('AccountKeyWordsContainer'))).toBeVisible()
}

const arriveAtHomeScreen = async () => {
  // Arrived to Home screen
  await expect(element(by.id('HomeAction-Send'))).toBeVisible()
}

const openHamburger = async () => {
  // Able to open the drawer - testing https://github.com/valora-inc/wallet/issues/3043
  await waitForElementId('Hamburger')
  await element(by.id('Hamburger')).tap()
  await waitForElementId('Drawer/Header')
}

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

    // Set & Verify pin
    await enterPinUi()
    await enterPinUi()

    // Protect Wallet screen
    await completeProtectWalletScreen()

    // Skip Phone Number verification
    await element(by.id('PhoneVerificationSkipHeader')).tap()

    // Choose your own adventure (CYA screen)
    await waitForElementByIdAndTap('ChooseYourAdventure/Later')

    // Arrived to Home screen
    await arriveAtHomeScreen()

    // Able to open the drawer
    await openHamburger()
  })

  it('Should be able to exit recovery phrase flow', async () => {
    await quickEducation()
    await waitFor(element(by.text('Cancel')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Cancel')).tap()

    // Cancel modal is shown
    await waitFor(element(by.text('Set Up Later')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Set Up Later')).tap()

    // App doesn't crash and we arrive at the home screen
    await arriveAtHomeScreen()
  })

  it('Setup Recovery Phrase', async () => {
    await openHamburger()
    await quickEducation()

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
    await waitFor(element(by.id('HomeAction-Send')))
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
    const recoveryPhraseText = recoveryPhraseContainer.label
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
