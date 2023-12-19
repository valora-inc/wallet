import {
  DEFAULT_RECIPIENT_ADDRESS,
  SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER,
  SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER_DISPLAY,
  SAMPLE_BACKUP_KEY_VERIFIED,
} from '../utils/consts'
import { launchApp, reloadReactNative } from '../utils/retries'
import {
  enterPinUiIfNecessary,
  inputNumberKeypad,
  addComment,
  quickOnboarding,
  waitForElementByIdAndTap,
  waitForElementId,
  isElementVisible,
} from '../utils/utils'
const faker = require('@faker-js/faker')
import jestExpect from 'expect'

export default Send = () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  let randomComment = faker.lorem.words()
  describe('When multi-token send flow (old flow)', () => {
    beforeAll(async () => {
      await launchApp({
        newInstance: true,
        launchArgs: { statsigGateOverrides: `use_new_send_flow=false,use_viem_for_send=true` },
      })
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30 * 1000)
      await element(by.id('HomeAction-Send')).tap()
      await waitFor(element(by.id('SendSearchInput')))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('Then should be able to enter an address', async () => {
      await element(by.id('SearchInput')).tap()
      await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
      await element(by.id('SearchInput')).tapReturnKey()
      await expect(element(by.text('0xe5f5...8846')).atIndex(0)).toBeVisible()
    })

    it('Then tapping a recipient should show bottom sheet', async () => {
      await element(by.text('0xe5f5...8846')).atIndex(0).tap()
      await waitFor(element(by.id('CELOBalance')))
        .toBeVisible()
        .withTimeout(30 * 1000)
      await expect(element(by.id('CELOBalance'))).toBeVisible()
      await expect(element(by.id('cUSDBalance'))).toBeVisible()
      await expect(element(by.id('cEURBalance'))).toBeVisible()
    })

    it('Then tapping a token should navigate to send amount', async () => {
      await element(by.id('CELOBalance')).tap()
      await expect(element(by.id('MaxButton'))).toBeVisible()
      await expect(element(by.id('TokenPickerSelector'))).toBeVisible()
      await expect(element(by.id('SwapInput'))).toBeVisible()
    })

    it('Then should be able to change token', async () => {
      await element(by.id('TokenPickerSelector')).tap()
      await element(by.id('CELOTouchable')).tap()
      await expect(element(by.text('CELO')).atIndex(0)).toBeVisible()
      await element(by.id('TokenPickerSelector')).tap()
      await element(by.id('cUSDTouchable')).tap()
      await expect(element(by.text('cUSD')).atIndex(0)).toBeVisible()
      await element(by.id('TokenPickerSelector')).tap()
      await element(by.id('cEURTouchable')).tap()
      await expect(element(by.text('cEUR')).atIndex(0)).toBeVisible()
    })

    it.todo('Then should be able to use max button')

    it('Then should be able to change display from fiat to crypto', async () => {
      let startSymbol = await element(by.id('PrimaryInputSymbol')).getAttributes()
      jestExpect(startSymbol.text).toEqual('$')
      await element(by.id('SwapInput')).tap()
      let swappedOnceSymbol = await element(by.id('PrimaryInputSymbol')).getAttributes()
      jestExpect(swappedOnceSymbol.text).toEqual('cEUR')
    })

    it('Then should be able enter and clear an amount with long press on backspace', async () => {
      await inputNumberKeypad('0.01')
      let startInputAmount = await element(by.id('InputAmount')).getAttributes()
      jestExpect(startInputAmount.text).toEqual('0.01')
      await element(by.id('Backspace')).longPress()
      let clearedInputAmount = await element(by.id('InputAmount')).getAttributes()
      jestExpect(clearedInputAmount.text).toEqual('0')
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await inputNumberKeypad('0.10')
      await element(by.id('Review')).tap()
      await expect(element(by.id('ConfirmButton'))).toBeVisible()
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text('0xe5f5...8846'))).toBeVisible()
    })

    it('Then should be able to add a comment', async () => {
      await addComment('Starting Comment ❤️')
      let comment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(comment.text).toEqual('Starting Comment ❤️')
    })

    it.todo('Then should be able to display fee modal')

    it('Then should be able to edit amount', async () => {
      await element(by.id('BackChevron')).tap()
      await expect(element(by.id('Review'))).toBeVisible()
      await element(by.id('Backspace')).tap()
      await element(by.id('Backspace')).tap()
      await inputNumberKeypad('01')
      await element(by.id('Review')).tap()
      let amount = await element(by.id('SendAmount')).getAttributes()
      jestExpect(amount.text).toEqual('0.01 cEUR')
      let emptyComment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(emptyComment.text).toEqual('')
      await addComment(randomComment)
      let comment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(comment.text).toEqual(randomComment)
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.id('errorBanner'))).not.toBeVisible()
      await waitFor(element(by.id('HomeAction-Send')))
        .toBeVisible()
        .withTimeout(30 * 1000)
    })

    it.todo('Then should display transaction as pending')

    it.todo('Then should display transaction as confirmed')

    it.todo('Then should display correct transaction details')
  })

  it('Then should be able to perform Nomspace lookup (old flow)', async () => {
    await reloadReactNative()
    await waitFor(element(by.id('HomeAction-Send')))
      .toBeVisible()
      .withTimeout(30 * 1000)
    await element(by.id('HomeAction-Send')).tap()
    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText('Hello.nom')
    await waitFor(element(by.id('RecipientItem')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  describe('When multi-token send flow to address (new flow)', () => {
    beforeAll(async () => {
      await launchApp({
        newInstance: true,
        launchArgs: {
          statsigGateOverrides: `use_new_send_flow=true,use_viem_for_send=true`,
        },
      })
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementByIdAndTap('HomeAction-Send', 30 * 1000)
      await waitForElementId('SendSelectRecipientSearchInput', 30 * 1000)
    })

    it('Then should be able to enter an address', async () => {
      await element(by.id('SendSelectRecipientSearchInput')).tap()
      await element(by.id('SendSelectRecipientSearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
      await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
      await expect(element(by.text('0xe5f5...8846')).atIndex(0)).toBeVisible()
    })

    it('Then tapping a recipient should show send button', async () => {
      await element(by.text('0xe5f5...8846')).atIndex(0).tap()
      await waitForElementId('SendOrInviteButton', 30 * 1000)
    })

    it('Then tapping send button should navigate to Send Enter Amount screen', async () => {
      await element(by.id('SendOrInviteButton')).tap()
      await waitForElementId('SendEnterAmount/Input', 30 * 1000)
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

    it.todo('Then should be able to use max button')

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await element(by.id('SendEnterAmount/Input')).tap()
      await element(by.id('SendEnterAmount/Input')).replaceText('0.10')
      await element(by.id('SendEnterAmount/ReviewButton')).tap()
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text('0xe5f5...8846'))).toBeVisible()
    })

    it('Then should be able to add a comment', async () => {
      await addComment('Starting Comment ❤️')
      let comment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(comment.text).toEqual('Starting Comment ❤️')
    })

    it.todo('Then should be able to display fee modal')

    it('Then should be able to edit amount', async () => {
      await element(by.id('BackChevron')).tap()
      await isElementVisible('SendEnterAmount/ReviewButton')
      await element(by.id('SendEnterAmount/Input')).tap()
      await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
      await element(by.id('SendEnterAmount/ReviewButton')).tap()
      let amount = await element(by.id('SendAmount')).getAttributes()
      jestExpect(amount.text).toEqual('0.01 cEUR')
      let emptyComment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(emptyComment.text).toEqual('')
      await addComment(randomComment)
      let comment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(comment.text).toEqual(randomComment)
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.id('errorBanner'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30 * 1000)
    })

    it.todo('Then should display transaction as pending')

    it.todo('Then should display transaction as confirmed')

    it.todo('Then should display correct transaction details')
  })

  describe('When multi-token send flow to recent recipient (new flow)', () => {
    beforeAll(async () => {
      await launchApp({
        newInstance: false,
        launchArgs: { statsigGateOverrides: `use_new_send_flow=true,use_viem_for_send=true` },
      })
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementByIdAndTap('HomeAction-Send', 30 * 1000)
      await waitFor(element(by.text('0xe5f5...8846')))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('Then should be able to click on recent recipient', async () => {
      await element(by.text('0xe5f5...8846')).atIndex(0).tap()
      await waitForElementId('SendEnterAmount/Input', 30 * 1000)
    })

    it('Then should be able to choose token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cEURSymbol')).tap()
      await expect(element(by.text('cEUR')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await element(by.id('SendEnterAmount/Input')).tap()
      await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
      await element(by.id('SendEnterAmount/ReviewButton')).tap()
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text('0xe5f5...8846'))).toBeVisible()
    })

    it('Then should be able to add a comment', async () => {
      await addComment(randomComment)
      let comment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(comment.text).toEqual(randomComment)
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.id('errorBanner'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30 * 1000)
    })

    it.todo('Then should display transaction as pending')

    it.todo('Then should display transaction as confirmed')

    it.todo('Then should display correct transaction details')
  })

  describe('When multi-token send flow to phone number with one address (new flow)', () => {
    beforeAll(async () => {
      await device.uninstallApp()
      await device.installApp()
      await launchApp({
        newInstance: true,
        launchArgs: { statsigGateOverrides: `use_new_send_flow=true,use_viem_for_send=true` },
      })
      await quickOnboarding(SAMPLE_BACKUP_KEY_VERIFIED)
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementByIdAndTap('HomeAction-Send', 30 * 1000)
      await waitForElementId('SendSelectRecipientSearchInput', 10 * 1000)
    })

    it('Then should be able to enter a phone number', async () => {
      await element(by.id('SendSelectRecipientSearchInput')).tap()
      await element(by.id('SendSelectRecipientSearchInput')).replaceText(
        SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER
      )
      await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
      await isElementVisible('RecipientItem', 0)
    })

    it('Then tapping a recipient should show send button', async () => {
      await element(by.id('RecipientItem')).atIndex(0).tap()
      await waitForElementId('SendOrInviteButton', 30 * 1000)
    })

    it('Then tapping send button should navigate to Send Enter Amount screen', async () => {
      await element(by.id('SendOrInviteButton')).tap()
      await waitForElementId('SendEnterAmount/Input', 30 * 1000)
    })

    it('Then should be able to select token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cUSDSymbol')).tap()
      await expect(element(by.text('cUSD')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await element(by.id('SendEnterAmount/Input')).tap()
      await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
      await element(by.id('SendEnterAmount/ReviewButton')).tap()
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text(SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER_DISPLAY))).toBeVisible()
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.id('errorBanner'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30 * 1000)
    })

    it.todo('Then should display transaction as pending')

    it.todo('Then should display transaction as confirmed')

    it.todo('Then should display correct transaction details')
  })
}
