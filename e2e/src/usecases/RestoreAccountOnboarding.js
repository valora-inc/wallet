import { E2E_WALLET_12_WORDS_MNEMONIC, E2E_WALLET_MNEMONIC } from 'react-native-dotenv'
import { WALLET_12_WORDS_ADDRESS, WALLET_ADDRESS } from '../utils/consts'
import { launchApp } from '../utils/retries'
import { enterPinUi, scrollIntoView, waitForElementById } from '../utils/utils'

export default RestoreAccountOnboarding = () => {
  beforeEach(async () => {
    await launchApp({ delete: true })
  })

  it.each`
    wordCount | phrase                          | walletAddress              | walletFunded | verifiedPhoneNumber
    ${'12'}   | ${E2E_WALLET_12_WORDS_MNEMONIC} | ${WALLET_12_WORDS_ADDRESS} | ${false}     | ${false}
    ${'24'}   | ${E2E_WALLET_MNEMONIC}          | ${WALLET_ADDRESS}          | ${true}      | ${true}
  `(
    'restores an existing wallet using a $wordCount word recovery phrase',
    async ({ phrase, walletAddress, walletFunded, verifiedPhoneNumber }) => {
      // choose restore flow
      await element(by.id('RestoreAccountButton')).tap()

      // accept terms
      await element(by.id('scrollView')).scrollTo('bottom')
      await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
      await element(by.id('AcceptTermsButton')).tap()

      // Set and verify pin
      await enterPinUi()
      await enterPinUi()

      // wait for connecting banner to go away
      // TODO measure how long this take
      await waitFor(element(by.id('connectingToCelo')))
        .not.toBeVisible()
        .withTimeout(20000)

      // enter the recovery phrase
      await element(by.id('ImportWalletBackupKeyInputField')).tap()
      await element(by.id('ImportWalletBackupKeyInputField')).replaceText(phrase)
      if (device.getPlatform() === 'ios') {
        // On iOS, type one more space to workaround onChangeText not being triggered with replaceText above
        // and leaving the restore button disabled
        await element(by.id('ImportWalletBackupKeyInputField')).typeText('\n')
      } else if (device.getPlatform() === 'android') {
        // Press back button to close the keyboard
        await device.pressBack()
      }

      // start wallet import
      await scrollIntoView('Restore', 'ImportWalletKeyboardAwareScrollView')
      await element(by.id('ImportWalletButton')).tap()

      if (!walletFunded) {
        // case where account not funded yet. dismiss zero balance modal to continue with onboarding.
        await waitForElementById('ConfirmUseAccountDialog/PrimaryAction', { tap: true })
      }

      if (!verifiedPhoneNumber) {
        // case where phone verification is required. skip it.
        await waitForElementById('PhoneVerificationSkipHeader', { tap: true })
      }

      // Choose your own adventure (CYA screen)
      await waitForElementById('ChooseYourAdventure/Later', { tap: true })

      // verify that we land on the home screen
      await expect(element(by.id('HomeAction-Send'))).toBeVisible()

      // verify that the correct account was restored
      await waitForElementById('WalletHome/SettingsGearButton', { tap: true })
      await waitForElementById('SettingsMenu/Address', { tap: true })

      await expect(element(by.text(walletAddress))).toBeVisible()
    }
  )
}
