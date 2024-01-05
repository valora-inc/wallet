import jestExpect from 'expect'
import {
  enterPinIfNecessary,
  quickOnboarding,
  waitForElementById,
  waitForElementByIdAndTap,
  waitForElementByText,
} from '../../utils/_utils'
import {
  SAMPLE_BACKUP_KEY_VERIFIED,
  SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER_DISPLAY,
} from '../../utils/consts'
import { launchApp } from '../../utils/retries'
import { addComment, confirmTransaction } from '../../utils/send'

const faker = require('@faker-js/faker')

describe('Send to Phone Number', () => {
  let commentText
  beforeAll(async () => {
    commentText = faker.lorem.words()
    await launchApp({
      delete: true,
      launchArgs: {
        statsigGateOverrides: 'use_new_send_flow=true,use_viem_for_send=true',
      },
      permissions: { contacts: 'YES' },
    })
    await quickOnboarding(SAMPLE_BACKUP_KEY_VERIFIED)
  })

  it('should navigate to send search input from home action', async () => {
    await waitForElementByIdAndTap('HomeAction-Send')
    await waitForElementById('SendSelectRecipientSearchInput')
  })

  it('should be able to enter a phone number', async () => {
    await waitForElementByIdAndTap('SendSelectRecipientSearchInput')
    await element(by.id('SendSelectRecipientSearchInput')).replaceText(
      SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER
    )
    await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
    await waitForElementById('RecipientItem')
  })

  it('tapping a recipient should show send button', async () => {
    await waitForElementByIdAndTap('RecipientItem')
    await waitForElementById('SendOrInviteButton')
  })

  it('tapping send button should navigate to Send Enter Amount screen', async () => {
    await waitForElementByIdAndTap('SendOrInviteButton')
    await waitForElementById('SendEnterAmount/Input')
  })

  it('should be able to select token', async () => {
    await waitForElementByIdAndTap('SendEnterAmount/TokenSelect')
    await waitForElementByIdAndTap('cUSDSymbol')
    await waitForElementByText('cUSD')
  })

  it('should be able to enter amount and navigate to review screen', async () => {
    await waitForElementByIdAndTap('SendEnterAmount/Input')
    await element(by.id('SendEnterAmount/Input')).replaceText('0.01')
    await element(by.id('SendEnterAmount/Input')).tapReturnKey()
    await waitForElementByIdAndTap('SendEnterAmount/ReviewButton')
    await waitForElementById('ConfirmButton')
  })

  it('should display correct recipient', async () => {
    await waitForElementByText(SINGLE_ADDRESS_VERIFIED_PHONE_NUMBER_DISPLAY)
  })

  it('should be able to add a comment', async () => {
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
