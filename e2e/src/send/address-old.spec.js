import jestExpect from 'expect'
import {
  addComment,
  enterPinIfNecessary,
  inputNumberKeypad,
  quickOnboarding,
  waitForElementById,
  waitForElementByIdAndTap,
  waitForElementByText,
} from '../utils/_utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { launchApp } from '../utils/retries'

const faker = require('@faker-js/faker')

describe('Send to Address (old flow)', () => {
  const commentText = faker.lorem.words()
  beforeAll(async () => {
    await launchApp({
      newInstance: true,
      launchArgs: {
        statsigGateOverrides: 'use_new_send_flow=false,use_viem_for_send=false',
        detoxPrintBusyIdleResources: 'YES',
        blacklistURLs: '.*blockchain-api-dot-celo-mobile-alfajores.*',
      },
      permissions: { contacts: 'YES' },
    })
    await quickOnboarding()
  })

  it('should navigate to send search input from home action', async () => {
    await waitForElementByIdAndTap('HomeAction-Send')
    await waitForElementById('SendSearchInput')
  })

  it('Then should be able to enter an address', async () => {
    await waitForElementByIdAndTap('SearchInput')
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()
    await waitForElementByText('0xe5f5...8846')
  })

  it('Then tapping a recipient should show bottom sheet', async () => {
    await element(by.text('0xe5f5...8846')).atIndex(0).tap()
    await waitForElementById('CELOBalance')
    await waitForElementById('cUSDBalance')
    await waitForElementById('cEURBalance')
  })

  it('Then tapping a token should navigate to send amount', async () => {
    await waitForElementByIdAndTap('CELOBalance')
    await waitForElementById('MaxButton')
    await waitForElementById('TokenPickerSelector')
    await waitForElementById('SwapInput')
  })

  it('Then should be able to change token', async () => {
    await waitForElementByIdAndTap('TokenPickerSelector')
    await waitForElementByIdAndTap('CELOTouchable')
    await waitForElementByText('CELO')
    await waitForElementByIdAndTap('TokenPickerSelector')
    await waitForElementByIdAndTap('cUSDTouchable')
    await waitForElementByText('cUSD')
    await waitForElementByIdAndTap('TokenPickerSelector')
    await waitForElementByIdAndTap('cEURTouchable')
    await waitForElementByText('cEUR')
  })

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
    await waitForElementByIdAndTap('Review')
    await waitForElementById('ConfirmButton')
  })

  it('Then should be able to add a comment', async () => {
    await addComment('Starting Comment ❤️')
    let comment = await element(by.id('commentInput/send')).getAttributes()
    jestExpect(comment.text).toEqual('Starting Comment ❤️')
  })

  it('Then should be able to edit amount', async () => {
    await waitForElementByIdAndTap('BackChevron')
    await waitForElementById('Review')
    await waitForElementByIdAndTap('Backspace')
    await waitForElementByIdAndTap('Backspace')
    await inputNumberKeypad('01')
    await waitForElementByIdAndTap('Review')
    let amount = await element(by.id('SendAmount')).getAttributes()
    jestExpect(amount.text).toEqual('0.01 cEUR')
    let emptyComment = await element(by.id('commentInput/send')).getAttributes()
    jestExpect(emptyComment.text).toEqual('')
    await addComment(commentText)
    let comment = await element(by.id('commentInput/send')).getAttributes()
    jestExpect(comment.text).toEqual(commentText)
  })

  it('Then should be able to send', async () => {
    await waitForElementByIdAndTap('ConfirmButton')
    await enterPinIfNecessary()
    await waitForElementById('HomeAction-Send')

    // Comment should be present in the feed
    const { elements } = await element(by.id('TransferFeedItem/subtitle')).getAttributes()
    jestExpect(elements.some((element) => element.text === commentText)).toBeTruthy()

    // Scroll to transaction
    await waitFor(element(by.text(commentText)))
      .toBeVisible()
      .whileElement(by.id('TransactionList'))
      .scroll(100, 'down')

    // Navigate to transaction details
    await element(by.text(commentText)).tap()

    // Completed and comment present in transaction details
    await waitForElementByText(commentText)
    await waitForElementByText('Completed')
  })
})
