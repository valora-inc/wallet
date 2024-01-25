import jestExpect from 'expect'
import {
  DEFAULT_RECIPIENT_ADDRESS,
  SAMPLE_BACKUP_KEY_VERIFIED,
  SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER,
  SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER_DISPLAY,
} from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  addComment,
  confirmTransaction,
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

  describe('When multi-token send flow to address (new flow)', () => {
    let commentText
    beforeAll(async () => {
      commentText = `${new Date().getTime()}-${parseInt(Math.random() * 100000)}`
      await launchApp({
        newInstance: true,
        launchArgs: {
          statsigGateOverrides: `use_new_send_flow=true,use_viem_for_send=true`,
        },
      })
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
      await waitForElementId('SendEnterAmount/Input', 30_000)
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
      await waitForElementByIdAndTap('SendEnterAmount/Input', 30_000)
      await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
      await element(by.id('SendEnterAmount/Input')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)
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

    it('Then should be able to edit amount', async () => {
      await element(by.id('BackChevron')).tap()
      await isElementVisible('SendEnterAmount/ReviewButton')
      await element(by.id('SendEnterAmount/Input')).tap()
      await waitForElementByIdAndTap('SendEnterAmount/Input', 30_000)
      await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
      await element(by.id('SendEnterAmount/Input')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)
      let amount = await element(by.id('SendAmount')).getAttributes()
      jestExpect(amount.text).toEqual('0.01 cEUR')
      let emptyComment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(emptyComment.text).toEqual('')
      await addComment(commentText)
      let comment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(comment.text).toEqual(commentText)
    })

    it('Then should be able to send', async () => {
      await waitForElementByIdAndTap('ConfirmButton', 30_000)
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30_000)
      await confirmTransaction(commentText)
    })
  })

  describe('When multi-token send flow to recent recipient (new flow)', () => {
    let commentText
    beforeAll(async () => {
      commentText = `${new Date().getTime()}`
      await launchApp({
        newInstance: true,
        launchArgs: { statsigGateOverrides: `use_new_send_flow=true,use_viem_for_send=true` },
      })
    })

    it('Then should navigate to send search input from home action', async () => {
      await waitForElementByIdAndTap('HomeAction-Send', 30_000)
      await waitFor(element(by.text('0xe5f5...8846')))
        .toBeVisible()
        .withTimeout(10_000)
    })

    it('Then should be able to click on recent recipient', async () => {
      await element(by.text('0xe5f5...8846')).atIndex(0).tap()
      await waitForElementId('SendEnterAmount/Input', 30_000)
    })

    it('Then should be able to choose token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cEURSymbol')).tap()
      await expect(element(by.text('cEUR')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await waitForElementByIdAndTap('SendEnterAmount/Input', 30_000)
      await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
      await element(by.id('SendEnterAmount/Input')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text('0xe5f5...8846'))).toBeVisible()
    })

    it('Then should be able to add a comment', async () => {
      await addComment(commentText)
      let comment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(comment.text).toEqual(commentText)
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30_000)
      await confirmTransaction(commentText)
    })
  })

  describe('When multi-token send flow to phone number with one address (new flow)', () => {
    let commentText
    beforeAll(async () => {
      commentText = `${new Date().getTime()}`
      await device.uninstallApp()
      await device.installApp()
      await launchApp({
        newInstance: true,
        launchArgs: { statsigGateOverrides: `use_new_send_flow=true,use_viem_for_send=true` },
      })
      await quickOnboarding(SAMPLE_BACKUP_KEY_VERIFIED)
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
      await waitForElementId('SendEnterAmount/Input', 30_000)
    })

    it('Then should be able to select token', async () => {
      await element(by.id('SendEnterAmount/TokenSelect')).tap()
      await element(by.id('cUSDSymbol')).tap()
      await expect(element(by.text('cUSD')).atIndex(0)).toBeVisible()
    })

    it('Then should be able to enter amount and navigate to review screen', async () => {
      await waitForElementByIdAndTap('SendEnterAmount/Input', 30_000)
      await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
      await element(by.id('SendEnterAmount/Input')).tapReturnKey()
      await waitForElementByIdAndTap('SendEnterAmount/ReviewButton', 30_000)
      await isElementVisible('ConfirmButton')
    })

    it('Then should display correct recipient', async () => {
      await expect(element(by.text(SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER_DISPLAY))).toBeVisible()
    })

    it('Then should be able to add a comment', async () => {
      await addComment(commentText)
      let comment = await element(by.id('commentInput/send')).getAttributes()
      jestExpect(comment.text).toEqual(commentText)
    })

    it('Then should be able to send', async () => {
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()
      await expect(element(by.text('Transaction failed, please retry'))).not.toBeVisible()
      await waitForElementId('HomeAction-Send', 30_000)
      await confirmTransaction(commentText)
    })
  })
}
