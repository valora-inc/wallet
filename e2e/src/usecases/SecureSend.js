import { SAMPLE_BACKUP_KEY_VERIFIED } from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  addComment,
  enterPinUiIfNecessary,
  inputNumberKeypad,
  scrollIntoView,
  sleep,
  quickOnboarding,
} from '../utils/utils'
const faker = require('@faker-js/faker')

// const PHONE_NUMBER = '+15203140983'
const PHONE_NUMBER = '+31619789443'
const LAST_ACCOUNT_CHARACTERS = 'f192'
const AMOUNT_TO_SEND = '0.1'

export default SecureSend = () => {
  describe.each([{ web3Library: 'contract-kit' }, { web3Library: 'viem' }])(
    'Secure send flow with phone number lookup (with $web3Library)',
    ({ web3Library }) => {
      beforeAll(async () => {
        // uninstall the app to remove secure send mapping
        await device.uninstallApp()
        await device.installApp()
        await launchApp({
          newInstance: true,
          permissions: { notifications: 'YES', contacts: 'YES' },
          launchArgs: {
            statsigGateOverrides: `use_new_send_flow=false,use_viem_for_send=${
              web3Library === 'viem'
            }`,
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
        await element(by.id('SearchInput')).replaceText(PHONE_NUMBER)
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
        for (let index = 0; index < 4; index++) {
          const character = LAST_ACCOUNT_CHARACTERS[index]
          await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
        }

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
    }
  )
}
