import jestExpect from 'expect'
import {
  DEFAULT_RECIPIENT_ADDRESS,
  SAMPLE_BACKUP_KEY_VERIFIED,
  SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER,
  SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER_DISPLAY,
} from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  enterPinUiIfNecessary,
  isElementVisible,
  quickOnboarding,
  waitForElementByIdAndTap,
  waitForElementId,
} from '../utils/utils'

export default Send = () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When multi-token send flow to address', () => {
    beforeAll(async () => {
      await launchApp({ newInstance: true })
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementByIdAndTap('HomeAction-Send', 30_000)
      await waitForElementId('SendSelectRecipientSearchInput', 30_000)
    })

    it('Then should be able to enter an address', async () => {
      await waitForElementByIdAndTap('SendSelectRecipientSearchInput', 30_000)
      await element(by.id('SendSelectRecipientSearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
      await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
      await expect(element(by.text('0xe5f5...8846')).atIndex(0)).toBeVisible()
    })

    it('Then tapping a recipient should show send button', async () => {
      await element(by.text('0xe5f5...8846')).atIndex(0).tap()
      await waitForElementId('SendOrInviteButton', 30_000)
    })

    it('Then tapping send button should navigate to Send Enter Amount screen', async () => {
      await element(by.id('SendOrInviteButton')).tap()
      await waitForElementId('SendEnterAmount/TokenAmountInput', 30_000)
    })

    it('Then should be able to change token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('CELOSymbol')).tap()
      await expect(element(by.text('CELO')).atIndex(0)).toBeVisible()
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cUSDSymbol')).tap()
      await expect(element(by.text('cUSD')).atIndex(0)).toBeVisible()
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cEURSymbol')).tap()
      await expect(element(by.text('cEUR')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await waitForElementByIdAndTap('SendEnterAmount/TokenAmountInput', 30_000)
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text('0xe5f5...8846'))).toBeVisible()
    })

    it('Then should be able to edit amount', async () => {
      await element(by.id('BackChevron')).tap()
      await isElementVisible('SendEnterAmount/ReviewButton')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tap()
      await waitForElementByIdAndTap('SendEnterAmount/TokenAmountInput', 30_000)
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)
      let amount = await element(by.id('SendAmount')).getAttributes()
      jestExpect(amount.text).toEqual('0.01 cEUR')
    })

    it('Then should be able to send', async () => {
      await waitForElementByIdAndTap('ConfirmButton', 30_000)
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30_000)
    })
  })

  describe('When multi-token send flow to recent recipient', () => {
    beforeAll(async () => {
      await launchApp({ newInstance: true })
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementByIdAndTap('HomeAction-Send', 30_000)
      await waitFor(element(by.text('0xe5f5...8846')))
        .toBeVisible()
        .withTimeout(10_000)
    })

    it('Then should be able to click on recent recipient', async () => {
      await element(by.text('0xe5f5...8846')).atIndex(0).tap()
      await waitForElementId('SendEnterAmount/TokenAmountInput', 30_000)
    })

    it('Then should be able to choose token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cEURSymbol')).tap()
      await expect(element(by.text('cEUR')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await waitForElementByIdAndTap('SendEnterAmount/TokenAmountInput', 30_000)
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text('0xe5f5...8846'))).toBeVisible()
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30_000)
    })
  })

  // TODO(mobilestack): Un-skip these if we ever support CPV.
  // This is the ONLY place in tests where the centrally verified e2e account
  // is used, so enabling these also means we'll need to add this account (SAMPLE_BACKUP_KEY_VERIFIED)
  // back into the funding scripts.
  describe.skip('When multi-token send flow to phone number with one address', () => {
    beforeAll(async () => {
      await device.uninstallApp()
      await device.installApp()
      await launchApp({ newInstance: true })
      await quickOnboarding({ mnemonic: SAMPLE_BACKUP_KEY_VERIFIED })
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementByIdAndTap('HomeAction-Send', 30_000)
      await waitForElementId('SendSelectRecipientSearchInput', 10_000)
    })

    it('Then should be able to enter a phone number', async () => {
      await waitForElementByIdAndTap('SendSelectRecipientSearchInput', 30_000)
      await element(by.id('SendSelectRecipientSearchInput')).typeText(
        SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER
      )
      await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
      await isElementVisible('RecipientItem', 0)
    })

    it('Then tapping a recipient should show send button', async () => {
      await element(by.id('RecipientItem')).atIndex(0).tap()
      await waitForElementId('SendOrInviteButton', 30_000)
    })

    it('Then tapping send button should navigate to Send Enter Amount screen', async () => {
      await element(by.id('SendOrInviteButton')).tap()
      await waitForElementId('SendEnterAmount/TokenAmountInput', 30_000)
    })

    it('Then should be able to select token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cUSDSymbol')).tap()
      await expect(element(by.text('cUSD')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await waitForElementByIdAndTap('SendEnterAmount/TokenAmountInput', 30_000)
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text(SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER_DISPLAY))).toBeVisible()
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30_000)
    })
  })
}
