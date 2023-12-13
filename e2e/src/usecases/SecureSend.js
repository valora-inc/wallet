import {
  SAMPLE_BACKUP_KEY_VERIFIED,
  VERIFIED_PHONE_NUMBER,
  SAMPLE_WALLET_ADDRESS_VERIFIED_2,
} from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  addComment,
  enterPinUiIfNecessary,
  inputNumberKeypad,
  scrollIntoView,
  quickOnboarding,
} from '../utils/utils'
const faker = require('@faker-js/faker')

const AMOUNT_TO_SEND = '0.01'

export default SecureSend = () => {
  describe('Secure send flow with phone number lookup (old flow)', () => {
    beforeAll(async () => {
      // uninstall the app to remove secure send mapping
      await device.uninstallApp()
      await device.installApp()
      await launchApp({
        newInstance: true,
        permissions: { notifications: 'YES', contacts: 'YES' },
        launchArgs: {
          statsigGateOverrides: `use_new_send_flow=false,use_viem_for_send=true`,
        },
      })
      await quickOnboarding(SAMPLE_BACKUP_KEY_VERIFIED)
    })

    it('Send cUSD to phone number with multiple mappings', async () => {
      let randomContent = faker.lorem.words()
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30000)
      await element(by.id('HomeAction-Send')).tap()
      await waitFor(element(by.id('SendSearchInput'))).toBeVisible()

      await element(by.id('SearchInput')).tap()
      await element(by.id('SearchInput')).replaceText(VERIFIED_PHONE_NUMBER)
      await element(by.id('RecipientItem')).tap()

      // Select the currency
      await waitFor(element(by.id('cUSDTouchable'))).toBeVisible()
      await element(by.id('cUSDTouchable')).tap()

      // Enter the amount and review
      await inputNumberKeypad(AMOUNT_TO_SEND)
      await element(by.id('Review')).tap()

      // Use the last digits of the account to confirm the sender.
      await waitFor(element(by.id('confirmAccountButton'))).toBeVisible()
      await element(by.id('confirmAccountButton')).tap()
      // TODO: test case for AddressValidationType.PARTIAL but relies on mapping phone number to another address with unique last 4 digits
      // for (let index = 0; index < 4; index++) {
      //   const character = LAST_ACCOUNT_CHARACTERS[index]
      //   await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
      // }
      await element(by.id('ValidateRecipientAccount/TextInput')).replaceText(
        SAMPLE_WALLET_ADDRESS_VERIFIED_2
      )

      // Scroll to see submit button
      await scrollIntoView('Submit', 'KeyboardAwareScrollView', 50)
      await element(by.id('ConfirmAccountButton')).tap()

      // Write a comment.
      await addComment(randomContent)

      // Confirm and input PIN if necessary.
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30 * 1000)

      await waitFor(element(by.text(`${randomContent}`)))
        .toBeVisible()
        .withTimeout(60000)
    })
  })
  describe('Secure send flow with phone number lookup (new flow)', () => {
    beforeAll(async () => {
      // uninstall the app to remove secure send mapping
      await device.uninstallApp()
      await device.installApp()
      await launchApp({
        newInstance: true,
        permissions: { notifications: 'YES', contacts: 'YES' },
        launchArgs: {
          statsigGateOverrides: `use_new_send_flow=true,use_viem_for_send=true`,
        },
      })
      await quickOnboarding(SAMPLE_BACKUP_KEY_VERIFIED)
    })

    it('Send cUSD to phone number with multiple mappings', async () => {
      let randomContent = faker.lorem.words()
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30000)
      await element(by.id('HomeAction-Send')).tap()
      await waitFor(element(by.id('SendSelectRecipientSearchInput'))).toBeVisible()

      await element(by.id('SendSelectRecipientSearchInput')).tap()
      await element(by.id('SendSelectRecipientSearchInput')).replaceText(VERIFIED_PHONE_NUMBER)
      await element(by.id('RecipientItem')).tap()

      await element(element(by.id('SendOrInviteButton'))).toBeVisible()
      await element(element(by.id('SendOrInviteButton'))).tap()

      // Select the currency
      await waitFor(element(by.id('SendEnterAmount/TokenSelect'))).toBeVisible()
      await waitFor(element(by.id('cUSDTouchable'))).toBeVisible()
      await element(by.id('cUSDTouchable')).tap()

      // Enter the amount and review
      await inputNumberKeypad(AMOUNT_TO_SEND)
      await element(by.id('SendEnterAmount/ReviewButton')).tap()

      // Use the last digits of the account to confirm the sender.
      await waitFor(element(by.id('confirmAccountButton'))).toBeVisible()
      await element(by.id('confirmAccountButton')).tap()
      // TODO: test case for AddressValidationType.PARTIAL but relies on mapping phone number to another address with unique last 4 digits
      // for (let index = 0; index < 4; index++) {
      //   const character = LAST_ACCOUNT_CHARACTERS[index]
      //   await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
      // }
      await element(by.id('ValidateRecipientAccount/TextInput')).replaceText(
        SAMPLE_WALLET_ADDRESS_VERIFIED_2
      )

      // Scroll to see submit button
      await scrollIntoView('Submit', 'KeyboardAwareScrollView', 50)
      await element(by.id('ConfirmAccountButton')).tap()

      // Write a comment.
      await addComment(randomContent)

      // Confirm and input PIN if necessary.
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30 * 1000)

      await waitFor(element(by.text(`${randomContent}`)))
        .toBeVisible()
        .withTimeout(60000)
    })
  })
}
