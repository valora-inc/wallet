import { E2E_WALLET_MNEMONIC } from 'react-native-dotenv'
import { reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, navigateToSecurity, waitForElementId } from '../utils/utils'

export default ResetAccount = () => {
  beforeEach(async () => {
    await reloadReactNative()
  })

  it('Reset Account by doing the Recovery Phrase quiz', async () => {
    // This test has very high flakiness on Android. I did my best to fix it, but
    // locally it works every time but on CI it fails 50%+ of the time.
    // TODO: Keep investigating the source of flakiness of this test on Android.
    // if (device.getPlatform() === 'android') {
    //   return
    // }

    await navigateToSecurity()

    try {
      await waitFor(element(by.text('ResetAccount')))
        .toBeVisible()
        .whileElement(by.id('SettingsScrollView'))
        .scroll(350, 'down')
    } catch {}
    await element(by.id('ResetAccount')).tap()
    await element(by.id('ResetAccountButton')).tap()

    await enterPinUiIfNecessary()

    // Go through the quiz.
    await element(by.id('backupKeySavedSwitch')).longPress()
    await element(by.id('backupKeyContinue')).tap()
    const mnemonic = E2E_WALLET_MNEMONIC.split(' ')
    await waitForElementId(`backupQuiz/${mnemonic[0]}`)
    for (const word of mnemonic) {
      await element(by.id(`backupQuiz/${word}`)).tap()
    }
    await element(by.id('QuizSubmit')).tap()

    // We can't actually confirm because the app will restart and Detox will hang.
    // TODO: Figure out a way to confirm and test that the app goes to the onboarding
    // screen on next open.
    // await element(by.id('ConfirmAccountRemovalModal/PrimaryAction')).tap()
    await waitForElementId('ConfirmAccountRemovalModal/PrimaryAction')
    await expect(element(by.id('ConfirmAccountRemovalModal/PrimaryAction'))).toBeVisible()
  })
}
