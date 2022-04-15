import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import {
  enterPinUiIfNecessary,
  inputNumberKeypad,
  sleep,
  waitForElementId,
  addComment,
} from '../utils/utils'
const faker = require('@faker-js/faker')
const jestExpect = require('expect')

export default Send = () => {
  let randomComment = faker.lorem.words()
  describe('When multi-token send flow', () => {
    beforeAll(async () => {
      await reloadReactNative()
    })

    it('Then should navigate to send search input from bottom bar', async () => {
      await waitFor(element(by.id('SendOrRequestBar/SendButton')))
        .toBeVisible()
        .withTimeout(30 * 1000)
      await element(by.id('SendOrRequestBar/SendButton')).tap()
      await waitFor(element(by.id('SendSearchInput')))
        .toBeVisible()
        .withTimeout(10 * 1000)
    })

    it('Then should be able to enter an address', async () => {
      await element(by.id('SearchInput')).tap()
      await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
      await element(by.id('SearchInput')).tapReturnKey()
      await expect(element(by.text('Account 0xe5f5...8846')).atIndex(0)).toBeVisible()
    })

    it('Then tapping a recipient should navigate to send amount', async () => {
      await element(by.text('Account 0xe5f5...8846')).atIndex(0).tap()
      await expect(element(by.id('MaxButton'))).toBeVisible()
      await expect(element(by.id('onChangeToken'))).toBeVisible()
      await expect(element(by.id('SwapInput'))).toBeVisible()
    })

    it('Then should be able to change token', async () => {
      await element(by.id('onChangeToken')).tap()
      await element(by.id('CELOTouchable')).tap()
      await expect(element(by.text('CELO')).atIndex(0)).toBeVisible()
      await element(by.id('onChangeToken')).tap()
      await element(by.id('cUSDTouchable')).tap()
      await expect(element(by.text('cUSD')).atIndex(0)).toBeVisible()
      await element(by.id('onChangeToken')).tap()
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
      await expect(element(by.text('Account 0xe5f5...8846'))).toBeVisible()
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
      await waitFor(element(by.id('SendOrRequestBar/SendButton')))
        .toBeVisible()
        .withTimeout(30 * 1000)
    })

    it.todo('Then should display transaction as pending')

    it.todo('Then should display transaction as confirmed')

    it.todo('Then should display correct transaction details')
  })

  it('Then should be able to perform Nomspace lookup', async () => {
    await reloadReactNative()
    await waitFor(element(by.id('SendOrRequestBar/SendButton')))
      .toBeVisible()
      .withTimeout(30 * 1000)
    await element(by.id('SendOrRequestBar/SendButton')).tap()
    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText('Hello.nom')
    await waitFor(element(by.id('RecipientItem')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })
}
