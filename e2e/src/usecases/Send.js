import jestExpect from 'expect'
import {
  DEFAULT_RECIPIENT_ADDRESS,
  WALLET_SINGLE_VERIFIED_PHONE_NUMBER,
  WALLET_SINGLE_VERIFIED_PHONE_NUMBER_DISPLAY,
} from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  enterPinUiIfNecessary,
  getDisplayAddress,
  isElementVisible,
  quickOnboarding,
  waitForElementById,
} from '../utils/utils'

export default Send = () => {
  const recipientAddressDisplay = getDisplayAddress(DEFAULT_RECIPIENT_ADDRESS)
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When multi-token send flow to address', () => {
    beforeAll(async () => {
      await launchApp()
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementById('HomeAction-Send', { timeout: 30_000, tap: true })
      await waitForElementById('SendSelectRecipientSearchInput', { timeout: 30_000 })
    })

    it('Then should be able to enter an address', async () => {
      await waitForElementById('SendSelectRecipientSearchInput', {
        timeout: 30_000,
        tap: true,
      })
      await element(by.id('SendSelectRecipientSearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
      await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
      await expect(element(by.text(recipientAddressDisplay)).atIndex(0)).toBeVisible()
    })

    it('Then tapping a recipient should show send button', async () => {
      await element(by.text(recipientAddressDisplay)).atIndex(0).tap()
      await waitForElementById('SendOrInviteButton', { timeout: 30_000 })
    })

    it('Then tapping send button should navigate to Send Enter Amount screen', async () => {
      await element(by.id('SendOrInviteButton')).tap()
      await waitForElementById('SendEnterAmount/TokenAmountInput', { timeout: 30_000 })
    })

    it('Then should be able to change token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('CELOSymbol')).tap()
      await expect(element(by.text('CELO on Celo')).atIndex(0)).toBeVisible()
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cUSDSymbol')).tap()
      await expect(element(by.text('cUSD on Celo')).atIndex(0)).toBeVisible()
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cEURSymbol')).tap()
      await expect(element(by.text('cEUR on Celo')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await waitForElementById('SendEnterAmount/TokenAmountInput', {
        timeout: 30_000,
        tap: true,
      })
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.02')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementById('SendEnterAmount/ReviewButton', {
        timeout: 30_000,
        tap: true,
      })
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text(recipientAddressDisplay))).toBeVisible()
    })

    it('Then should be able to edit amount', async () => {
      await element(by.id('BackChevron')).tap()
      await isElementVisible('SendEnterAmount/ReviewButton')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tap()
      await waitForElementById('SendEnterAmount/TokenAmountInput', {
        timeout: 30_000,
        tap: true,
      })
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementById('SendEnterAmount/ReviewButton', {
        timeout: 30_000,
        tap: true,
      })
      let amount = await element(by.id('SendAmount')).getAttributes()
      jestExpect(amount.text).toEqual('0.01 cEUR')
    })

    it('Then should be able to send', async () => {
      await waitForElementById('ConfirmButton', { timeout: 30_000, tap: true })
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementById('HomeAction-Send', { timeout: 30_000 })
    })
  })

  describe('When multi-token send flow to recent recipient', () => {
    beforeAll(async () => {
      await launchApp()
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementById('HomeAction-Send', { timeout: 30_000, tap: true })
      await waitFor(element(by.text(recipientAddressDisplay)))
        .toBeVisible()
        .withTimeout(10_000)
    })

    it('Then should be able to click on recent recipient', async () => {
      await element(by.text(recipientAddressDisplay)).atIndex(0).tap()
      await waitForElementById('SendEnterAmount/TokenAmountInput', { timeout: 30_000 })
    })

    it('Then should be able to choose token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cEURSymbol')).tap()
      await expect(element(by.text('cEUR on Celo')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await waitForElementById('SendEnterAmount/TokenAmountInput', {
        timeout: 30_000,
        tap: true,
      })
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementById('SendEnterAmount/ReviewButton', {
        timeout: 30_000,
        tap: true,
      })
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text(recipientAddressDisplay))).toBeVisible()
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementById('HomeAction-Send', { timeout: 30_000 })
    })
  })

  describe('When multi-token send flow to phone number with one address', () => {
    beforeAll(async () => {
      await launchApp({ delete: true })
      await quickOnboarding()
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementById('HomeAction-Send', { timeout: 30_000, tap: true })
      await waitForElementById('SendSelectRecipientSearchInput', { timeout: 30_000 })
    })

    it('Then should be able to enter a phone number', async () => {
      await waitForElementById('SendSelectRecipientSearchInput', {
        timeout: 30_000,
        tap: true,
      })
      await element(by.id('SendSelectRecipientSearchInput')).typeText(
        WALLET_SINGLE_VERIFIED_PHONE_NUMBER
      )
      await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
      await isElementVisible('RecipientItem', 0)
    })

    it('Then tapping a recipient should show send button', async () => {
      await element(by.id('RecipientItem')).atIndex(0).tap()
      await waitForElementById('SendOrInviteButton', { timeout: 30_000 })
    })

    it('Then tapping send button should navigate to Send Enter Amount screen', async () => {
      await element(by.id('SendOrInviteButton')).tap()
      await waitForElementById('SendEnterAmount/TokenAmountInput', { timeout: 30_000 })
    })

    it('Then should be able to select token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cUSDSymbol')).tap()
      await expect(element(by.text('cUSD on Celo')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await waitForElementById('SendEnterAmount/TokenAmountInput', {
        timeout: 30_000,
        tap: true,
      })
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText('0.01')
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await waitForElementById('SendEnterAmount/ReviewButton', {
        timeout: 30_000,
        tap: true,
      })
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text(WALLET_SINGLE_VERIFIED_PHONE_NUMBER_DISPLAY))).toBeVisible()
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementById('HomeAction-Send', { timeout: 30_000 })
    })
  })
}
