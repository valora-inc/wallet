import { E2E_WALLET_PRIVATE_KEY, E2E_WALLET_SINGLE_VERIFIED_MNEMONIC } from 'react-native-dotenv'
import {
  WALLET_MULTIPLE_VERIFIED_ADDRESS,
  WALLET_MULTIPLE_VERIFIED_PHONE_NUMBER,
  WALLET_SINGLE_VERIFIED_ADDRESS,
} from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  enterPinUiIfNecessary,
  fundWallet,
  quickOnboarding,
  scrollIntoView,
  waitForElementByIdAndTap,
  waitForElementId,
} from '../utils/utils'

const AMOUNT_TO_SEND = '0.01'
const WALLET_FUNDING_MULTIPLIER = 2.2

export default SecureSend = () => {
  // TODO(mobilestack): Un-skip this if we ever support CPV
  describe.skip('Secure send flow with phone number lookup', () => {
    beforeAll(async () => {
      // fund wallet for send
      await fundWallet(
        E2E_WALLET_PRIVATE_KEY,
        WALLET_SINGLE_VERIFIED_ADDRESS,
        'cUSD',
        `${AMOUNT_TO_SEND * WALLET_FUNDING_MULTIPLIER}`
      )
      await launchApp({ delete: true })
      await quickOnboarding({ mnemonic: E2E_WALLET_SINGLE_VERIFIED_MNEMONIC })
    })

    it('Send cUSD to phone number with multiple mappings', async () => {
      await waitForElementByIdAndTap('HomeAction-Send', 30_000)
      await waitForElementByIdAndTap('SendSelectRecipientSearchInput', 3000)
      await element(by.id('SendSelectRecipientSearchInput')).replaceText(
        WALLET_MULTIPLE_VERIFIED_PHONE_NUMBER
      )
      await element(by.id('RecipientItem')).tap()

      await waitForElementByIdAndTap('SendOrInviteButton', 30_000)

      // Use the last digits of the account to confirm the sender.
      await waitForElementByIdAndTap('confirmAccountButton', 30_000)
      for (let index = 0; index < 4; index++) {
        const character = WALLET_MULTIPLE_VERIFIED_ADDRESS.charAt(
          WALLET_MULTIPLE_VERIFIED_ADDRESS.length - (4 - index)
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
      await element(by.id('SendEnterAmount/TokenAmountInput')).tap()
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText(AMOUNT_TO_SEND)
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await element(by.id('SendEnterAmount/ReviewButton')).tap()

      // Confirm and input PIN if necessary.
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitForElementId('HomeAction-Send', 30_000)
    })
  })
}
