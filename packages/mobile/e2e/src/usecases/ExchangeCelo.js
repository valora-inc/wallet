import { format } from 'date-fns'
import { celoEducation } from '../utils/celoEducation'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'
import {
  enterPinUiIfNecessary,
  isElementVisible,
  padTrailingZeros,
  sleep,
  waitForExpectNotVisible,
} from '../utils/utils'

const CELO_TO_SELL = 0.045
const CELO_TO_BUY = +Math.random().toFixed(3)
const CELO_TO_WITHDRAW = +Math.random().toFixed(3)
const CELO_TO_SELL_MIN = 0.002

const scrollToTopOfFeed = async () => {
  // Scroll to top of feed - scroll not possible if not all transactions loaded
  try {
    await waitFor(element(by.id('ExchangeScrollView')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.id('ExchangeScrollView')).scroll(200, 'down')
  } catch {}
}

const assertTransactionAppeared = async (amount, transactionTime) => {
  // Wait up to 1 minute and assert the transaction correctly appears
  await waitFor(
    element(
      by.text(`-${padTrailingZeros(amount.toFixed(3))}`).withAncestor(by.id('TransactionList'))
    ).atIndex(0)
  )
    .toBeVisible()
    .withTimeout(30 * 1000)
  await waitFor(
    element(
      by
        .text(`${format(transactionTime, "MMM d 'at' h':'mm a")}`)
        .withAncestor(by.id('TransactionList'))
    ).atIndex(0)
  )
    .toBeVisible()
    .withTimeout(30 * 1000)
}

export default ExchangeCelo = () => {
  beforeEach(async () => {
    await reloadReactNative()
    // Tap Hamburger Menu
    await element(by.id('Hamburger')).tap()
    // Tap CELO
    await element(by.id('CELO')).tap()
    // Complete CELO education if present - not the focus of these tests
    await celoEducation()
  })

  it('Then Buy CELO', async () => {
    // Wait for buy button
    await waitFor(element(by.text('Buy')))
      .toBeVisible()
      .withTimeout(5000)
    // Tap Buy
    await element(by.text('Buy')).tap()
    // Fill in the amount
    await element(by.id('ExchangeInput')).replaceText(`${CELO_TO_BUY}`)
    // TODO - Get first exchange rate
    // Send return key to close keyboard if review button is obscured by keyboard
    if (!(await isElementVisible('ExchangeReviewButton'))) {
      await element(by.id('ExchangeInput')).typeText('\n')
    }
    // TODO - Get second exchange rate
    // Sleep for 3 seconds on review
    await sleep(3 * 1000)
    // Tap Review
    await element(by.id('ExchangeReviewButton')).tap()
    // Tap Confirm
    await element(by.id('ConfirmExchange')).tap()
    // Enter PIN
    await enterPinUiIfNecessary()
    // Get transaction time
    let transactionTime = new Date()
    // Wait 10 seconds checking that error banner is not visible each second
    await waitForExpectNotVisible('errorBanner')
    await scrollToTopOfFeed()
    // Wait up to 1 minute and assert the transaction correctly appears
    // TODO: assert on amount minus fees
    await waitFor(element(by.text(`${format(transactionTime, "MMM d 'at' h':'mm a")}`)).atIndex(0))
      .toBeVisible()
      .withTimeout(30 * 1000)
    // TODO Check that transaction appears in home feed
  })

  it('Then Sell CELO', async () => {
    // Wait for buy button
    await waitFor(element(by.text('Sell')))
      .toBeVisible()
      .withTimeout(5000)
    // Tap Sell
    await element(by.text('Sell')).tap()
    // Fill in the amount
    await element(by.id('ExchangeInput')).replaceText(`${CELO_TO_SELL}`)
    // TODO - Get first exchange rate
    // Send return key to close keyboard if review button is obscured by keyboard
    if (!(await isElementVisible('ExchangeReviewButton'))) {
      await element(by.id('ExchangeInput')).typeText('\n')
    }
    // TODO - Get second exchange rate
    // Sleep for 3 seconds on review
    await sleep(3 * 1000)
    // Tap Review
    await element(by.id('ExchangeReviewButton')).tap()
    // Tap Confirm
    await element(by.id('ConfirmExchange')).tap()
    // Enter PIN
    await enterPinUiIfNecessary()
    // Get transaction time
    let transactionTime = new Date()
    // Wait 10 seconds checking that error banner is not visible each second
    await waitForExpectNotVisible('errorBanner')
    await scrollToTopOfFeed()
    await assertTransactionAppeared(CELO_TO_SELL, transactionTime)
    // TODO Check that transaction appears in home feed
  })

  // Note: Amount fluctuates based on CELO value
  it.skip('Then Sell Minimum CELO', async () => {
    // Wait for buy button
    await waitFor(element(by.text('Sell')))
      .toBeVisible()
      .withTimeout(5 * 1000)
    // Tap Sell
    await element(by.text('Sell')).tap()
    // Fill in the amount
    await element(by.id('ExchangeInput')).replaceText(`${CELO_TO_SELL_MIN}`)
    // TODO - Get first exchange rate
    // Send return key to close keyboard if review button is obscured by keyboard
    if (!(await isElementVisible('ExchangeReviewButton'))) {
      await element(by.id('ExchangeInput')).typeText('\n')
    }
    // TODO - Get second exchange rate
    // Sleep for 3 seconds on review
    await sleep(3 * 1000)
    // Tap Review
    await element(by.id('ExchangeReviewButton')).tap()
    // Tap Confirm
    await element(by.id('ConfirmExchange')).tap()
    // Enter PIN
    await enterPinUiIfNecessary()
    // Get transaction time
    let transactionTime = new Date()
    // Wait 10 seconds checking that error banner is not visible each second
    await waitForExpectNotVisible('errorBanner')
    await scrollToTopOfFeed()
    await assertTransactionAppeared(CELO_TO_SELL_MIN, transactionTime)
    // TODO Check that transaction appears in home feed
  })

  it('Then Withdraw CELO', async () => {
    // Scroll to the withdraw button
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .whileElement(by.id('ExchangeScrollView'))
      .scroll(50, 'down')
    // Tap withdraw
    await element(by.id('WithdrawCELO')).tap()
    // Wait on account address entry field
    await waitFor(element(by.id('AccountAddress')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    // Fill in the destination address
    await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    // Fill in the amount
    await element(by.id('CeloAmount')).replaceText(`${CELO_TO_WITHDRAW}`)
    // Send return key to close keyboard if review button is obscured by keyboard
    if (!(await isElementVisible('WithdrawReviewButton'))) {
      await element(by.id('ExchangeInput')).typeText('\n')
    }
    // Tap Review
    await element(by.id('WithdrawReviewButton')).tap()
    // Wait for confirm button
    await waitFor(element(by.id('ConfirmWithdrawButton')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    // Tap Confirm
    await element(by.id('ConfirmWithdrawButton')).tap()
    // Enter PIN
    await enterPinUiIfNecessary()
    // Get transaction time
    let transactionTime = new Date()
    // Wait 10 seconds checking that error banner is not visible each second
    await waitForExpectNotVisible('errorBanner')
    await scrollToTopOfFeed()
    await assertTransactionAppeared(CELO_TO_WITHDRAW, transactionTime)
    // TODO Check that transaction appears in home feed
  })
}
