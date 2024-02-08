import {
  SAMPLE_BACKUP_KEY_SINGLE_ADDRESS_VERIFIED,
  SAMPLE_PRIVATE_KEY,
  VERIFIED_PHONE_NUMBER,
  SAMPLE_WALLET_ADDRESS_SINGLE_ADDRESS_VERIFIED,
  SAMPLE_WALLET_ADDRESS_VERIFIED_2,
} from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  addComment,
  enterPinUiIfNecessary,
  fundWallet,
  inputNumberKeypad,
  scrollIntoView,
  quickOnboarding,
  waitForElementId,
  waitForElementByIdAndTap,
  confirmTransaction,
} from '../utils/utils'

const AMOUNT_TO_SEND = '0.01'
const WALLET_FUNDING_MULTIPLIER = 2.2

export default SecureSend = () => {
  describe('Secure send flow with phone number lookup (old flow)', () => {
    let commentText
    beforeAll(async () => {
      commentText = `${new Date().getTime()}-${parseInt(Math.random() * 100000)}`
      // uninstall the app to remove secure send mapping
      await device.uninstallApp()
      await device.installApp()
      // fund wallet for send
      await fundWallet(
        SAMPLE_PRIVATE_KEY,
        SAMPLE_WALLET_ADDRESS_SINGLE_ADDRESS_VERIFIED,
        'cUSD',
        `${AMOUNT_TO_SEND * WALLET_FUNDING_MULTIPLIER}`
      )
      await launchApp({
        newInstance: true,
        permissions: { notifications: 'YES', contacts: 'YES' },
        launchArgs: {
          statsigGateOverrides: `use_new_send_flow=false`,
        },
      })
      await quickOnboarding(SAMPLE_BACKUP_KEY_SINGLE_ADDRESS_VERIFIED)
    })

    it('Send cUSD to phone number with multiple mappings', async () => {
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30_000)
      await element(by.id('HomeAction-Send')).tap()
      await waitFor(element(by.id('SendSearchInput')))
        .toBeVisible()
        .withTimeout(30_000)

      await element(by.id('SearchInput')).tap()
      await element(by.id('SearchInput')).replaceText(VERIFIED_PHONE_NUMBER)
      await element(by.id('RecipientItem')).tap()

      // Select the currency
      await waitFor(element(by.id('cUSDTouchable')))
        .toBeVisible()
        .withTimeout(30_000)
      await element(by.id('cUSDTouchable')).tap()

      // Enter the amount and review
      await element(by.id('SwapInput')).tap()
      await inputNumberKeypad(AMOUNT_TO_SEND)
      await element(by.id('Review')).tap()

      // Use the last digits of the account to confirm the sender.
      await waitFor(element(by.id('confirmAccountButton')))
        .toBeVisible()
        .withTimeout(30_000)
      await element(by.id('confirmAccountButton')).tap()

      for (let index = 0; index < 4; index++) {
        const character = SAMPLE_WALLET_ADDRESS_VERIFIED_2.charAt(
          SAMPLE_WALLET_ADDRESS_VERIFIED_2.length - (4 - index)
        )
        await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
      }

      // Scroll to see submit button
      await scrollIntoView('Submit', 'KeyboardAwareScrollView', 50)
      await element(by.id('ConfirmAccountButton')).tap()

      // Write a comment.
      await addComment(commentText)

      // Confirm and input PIN if necessary.
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30_000)

      await confirmTransaction(commentText)
    })
  })

  // TODO(ACT-1044): Enable test after new send flow is fixed.
  xdescribe('Secure send flow with phone number lookup (new flow)', () => {
    beforeAll(async () => {
      // uninstall the app to remove secure send mapping
      await device.uninstallApp()
      await device.installApp()
      // fund wallet for send
      await fundWallet(
        SAMPLE_PRIVATE_KEY,
        SAMPLE_WALLET_ADDRESS_SINGLE_ADDRESS_VERIFIED,
        'cUSD',
        `${AMOUNT_TO_SEND * WALLET_FUNDING_MULTIPLIER}`
      )
      await launchApp({
        newInstance: true,
        permissions: { notifications: 'YES', contacts: 'YES' },
        launchArgs: {
          statsigGateOverrides: `use_new_send_flow=true`,
        },
      })
      await quickOnboarding(SAMPLE_BACKUP_KEY_SINGLE_ADDRESS_VERIFIED)
    })

    it('Send cUSD to phone number with multiple mappings', async () => {
      const commentText = 'test comment new'
      await waitForElementByIdAndTap('HomeAction-Send', 30_000)
      await waitForElementByIdAndTap('SendSelectRecipientSearchInput', 3000)
      await element(by.id('SendSelectRecipientSearchInput')).replaceText(VERIFIED_PHONE_NUMBER)
      await element(by.id('RecipientItem')).tap()

      await waitForElementByIdAndTap('SendOrInviteButton', 30_000)

      // Use the last digits of the account to confirm the sender.
      await waitForElementByIdAndTap('confirmAccountButton', 30_000)
      for (let index = 0; index < 4; index++) {
        const character = SAMPLE_WALLET_ADDRESS_VERIFIED_2.charAt(
          SAMPLE_WALLET_ADDRESS_VERIFIED_2.length - (4 - index)
        )
        await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
      }

      // Scroll to see submit button
      await scrollIntoView('Submit', 'KeyboardAwareScrollView', 50)
      await element(by.id('ConfirmAccountButton')).tap()

      // Select the currency
      await waitForElementByIdAndTap('SendEnterAmount/TokenSelect', 30_000)
      await waitForElementByIdAndTap('cUSDSymbol', 30_000)

      // Enter the amount and review
      await element(by.id('SendEnterAmount/Input')).tap()
      await element(by.id('SendEnterAmount/Input')).replaceText(AMOUNT_TO_SEND)
      await element(by.id('SendEnterAmount/Input')).tapReturnKey()
      await element(by.id('SendEnterAmount/ReviewButton')).tap()

      // Write a comment.
      await addComment(commentText)

      // Confirm and input PIN if necessary.
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitForElementId('HomeAction-Send', 30_000)

      await waitFor(element(by.text(`${commentText}`)))
        .toBeVisible()
        .withTimeout(60_000)
    })
  })
}
