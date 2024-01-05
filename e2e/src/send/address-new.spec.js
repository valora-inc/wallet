import jestExpect from 'expect'
import {
  addComment,
  enterPinIfNecessary,
  quickOnboarding,
  waitForElementById,
  waitForElementByIdAndTap,
  waitForElementByText,
} from '../utils/_utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { launchApp } from '../utils/retries'
import { confirmTransaction } from '../utils/send'

const faker = require('@faker-js/faker')

describe('Send to Address (new flow)', () => {
  let commentText
  beforeAll(async () => {
    commentText = faker.lorem.words()
    await launchApp({
      newInstance: true,
      launchArgs: {
        statsigGateOverrides: 'use_new_send_flow=true,use_viem_for_send=true',
        detoxPrintBusyIdleResources: 'YES',
        blacklistURLs: '.*blockchain-api-dot-celo-mobile-alfajores.*',
      },
      permissions: { notifications: 'YES', contacts: 'YES', camera: 'YES' },
    })
    await quickOnboarding()
  })

  it('should navigate to send search input from home action', async () => {
    await waitForElementByIdAndTap('HomeAction-Send')
    await waitForElementById('SendSelectRecipientSearchInput')
  })

  it('should be able to enter an address', async () => {
    await waitForElementByIdAndTap('SendSelectRecipientSearchInput')
    await element(by.id('SendSelectRecipientSearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
    await waitForElementByText('0xe5f5...8846')
  })

  it('tapping a recipient should show send button', async () => {
    await element(by.text('0xe5f5...8846')).atIndex(0).tap()
    await waitForElementById('SendOrInviteButton')
  })

  it('tapping send button should navigate to Send Enter Amount screen', async () => {
    await element(by.id('SendOrInviteButton')).tap()
    await waitForElementById('SendEnterAmount/Input')
  })

  it('should be able to change token', async () => {
    await waitForElementByIdAndTap('SendEnterAmount/TokenSelect')
    await waitForElementByIdAndTap('CELOSymbol')
    await waitForElementByText('CELO')
    await waitForElementByIdAndTap('SendEnterAmount/TokenSelect')
    await waitForElementByIdAndTap('cUSDSymbol')
    await waitForElementByText('cUSD')
    await waitForElementByIdAndTap('SendEnterAmount/TokenSelect')
    await waitForElementByIdAndTap('cEURSymbol')
    await waitForElementByText('cEUR')
  })

  it('should be able to enter amount and navigate to review screen', async () => {
    await waitForElementByIdAndTap('SendEnterAmount/Input')
    await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
    await element(by.id('SendEnterAmount/Input')).tapReturnKey()
    await waitForElementByIdAndTap('SendEnterAmount/ReviewButton')
    await waitForElementById('ConfirmButton')
  })

  it('should display correct recipient', async () => {
    await waitForElementByText('0xe5f5...8846')
  })

  it('should be able to add a comment', async () => {
    await addComment('Starting Comment ❤️')
    let comment = await element(by.id('commentInput/send')).getAttributes()
    jestExpect(comment.text).toEqual('Starting Comment ❤️')
  })

  it('should be able to edit amount', async () => {
    await waitForElementByIdAndTap('BackChevron')
    await waitForElementById('SendEnterAmount/ReviewButton')
    await waitForElementByIdAndTap('SendEnterAmount/Input')
    await waitForElementByIdAndTap('SendEnterAmount/Input')
    await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
    await element(by.id('SendEnterAmount/Input')).tapReturnKey()
    await waitForElementByIdAndTap('SendEnterAmount/ReviewButton')
    let amount = await element(by.id('SendAmount')).getAttributes()
    jestExpect(amount.text).toEqual('0.01 cEUR')
    let emptyComment = await element(by.id('commentInput/send')).getAttributes()
    jestExpect(emptyComment.text).toEqual('')
    await addComment(commentText)
    let comment = await element(by.id('commentInput/send')).getAttributes()
    jestExpect(comment.text).toEqual(commentText)
  })

  it('should be able to send', async () => {
    await waitForElementByIdAndTap('ConfirmButton')
    await enterPinIfNecessary()
    await waitForElementById('HomeAction-Send')
    await confirmTransaction(commentText)
  })
})
