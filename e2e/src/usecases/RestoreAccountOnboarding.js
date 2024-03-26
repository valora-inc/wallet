import { getAddressChunks } from '@celo/utils/lib/address'
import {
  EXAMPLE_NAME,
  SAMPLE_BACKUP_KEY,
  SAMPLE_BACKUP_KEY_12_WORDS,
  SAMPLE_WALLET_ADDRESS,
  SAMPLE_WALLET_ADDRESS_12_WORDS,
} from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  enterPinUi,
  scrollIntoView,
  waitForElementByIdAndTap,
  waitForElementId,
} from '../utils/utils'

export default RestoreAccountOnboarding = () => {
  beforeEach(async () => {
    await device.uninstallApp()
    await device.installApp()
  })

  it.each`
    wordCount | phrase                        | walletAddress                     | navType
    ${'12'}   | ${SAMPLE_BACKUP_KEY_12_WORDS} | ${SAMPLE_WALLET_ADDRESS_12_WORDS} | ${'tab'}
    ${'24'}   | ${SAMPLE_BACKUP_KEY}          | ${SAMPLE_WALLET_ADDRESS}          | ${'drawer'}
  `(
    'restores an existing wallet using a $wordCount word recovery phrase ($navType)',
    async ({ phrase, walletAddress, navType }) => {
      // TODO(ACT-1133): move this back to beforeEach
      await launchApp({
        permissions: { notifications: 'YES', contacts: 'YES' },
        launchArgs: { statsigGateOverrides: `use_tab_navigator=${navType === 'tab'}` },
      })
      // choose restore flow
      await element(by.id('RestoreAccountButton')).tap()

      // accept terms
      await element(by.id('scrollView')).scrollTo('bottom')
      await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
      await element(by.id('AcceptTermsButton')).tap()

      // enter name
      await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
      await element(by.id('NameAndPictureContinueButton')).tap()

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

      // verification step comes after restoring wallet, skip this step
      await waitForElementId('PhoneVerificationSkipHeader')
      await element(by.id('PhoneVerificationSkipHeader')).tap()

      // verify that we land on the home screen
      await expect(element(by.id('HomeAction-Send'))).toBeVisible()

      // verify that the correct account was restored
      await waitForElementByIdAndTap(navType === 'tab' ? 'WalletHome/AccountCircle' : 'Hamburger')
      await scrollIntoView('Account Address', 'SettingsScrollView')

      const addressString = '0x ' + getAddressChunks(walletAddress).join(' ')
      await expect(element(by.text(addressString))).toBeVisible()
    }
  )
}
