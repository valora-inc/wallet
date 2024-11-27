import jestExpect from 'expect'
import { waitForElementId, waitForExpectNotVisible } from '../utils/utils'
import { sleep } from '../../../src/utils/sleep'

export default HomeFeed = () => {
  it('should show correct information on tap of feed item', async () => {
    // Load Wallet Home
    await waitForElementId('WalletHome')
    await waitForExpectNotVisible('TransactionList/loading')
    await waitFor(element(by.id('TransferFeedItem')).atIndex(0))
      .toBeVisible()
      .withTimeout(10_000)
    const feedItems = await element(by.id('TransferFeedItem')).getAttributes()
    const feedElement = feedItems.elements[0]

    // Extracts `0xebf9...2bcb` from `0xebf9...2bcb Payment Sent +$0.00 0.000000000000000001 CELO`
    const feedAddress = feedElement.label.split(' ')[0]

    // Extracts `CELO` from `0xebf9...2bcb Payment Sent +$0.00 0.000000000000000001 CELO`
    const feedCryptoSymbol = feedElement.label.split(' ').at(-1)

    // Extracts `0.0` from `0xebf9...2bcb Payment Sent +$0.0 0.000000000000000001 CELO` and converts to number
    const feedAmountFiat = +feedElement.label.match(/(\d+\.\d+)/)[1]

    // Extracts `0.000000000000000001` from `0xebf9...2bcb Payment Sent +$0.00 0.000000000000000001 CELO` and converts to number
    const feedAmountCrypto = +feedElement.label.split(' ').at(-2)

    // Tap top TransferFeedItem
    await element(by.id('TransferFeedItem')).atIndex(0).tap()

    // Get the amount elements
    const detailAmountElement = await element(
      by.id('LineItemRow/SentAmountValueFiat')
    ).getAttributes()
    const detailAmountCryptoElement = await element(
      by.id('LineItemRow/SentAmountValue')
    ).getAttributes()

    // Extracts 0.01 from $0.01 and converts to number
    const detailAmountFiat = +detailAmountElement.label.match(/(\d+\.\d+)/)[1]

    // Extract `0.000000000000000001` from `0.000000000000000001 CELO`
    const detailsCryptoSymbol = detailAmountCryptoElement.label.split(' ').at(-1)

    // Extracts `CELO` from `0.000000000000000001 CELO` and converts to number
    const detailAmountCrypto = +detailAmountCryptoElement.label.split(' ').at(-2)

    // Fiat should be within ~0.01
    jestExpect(feedAmountFiat).toBeCloseTo(detailAmountFiat)
    // Crypto should match with a precision of 18 decimals as the token is likely CELO or a cStable which have 18 decimals
    jestExpect(feedAmountCrypto).toBeCloseTo(detailAmountCrypto, 18)
    // Crypto symbol should match
    jestExpect(feedCryptoSymbol).toEqual(detailsCryptoSymbol)
    // Address should match
    await expect(element(by.text(feedAddress)).atIndex(0)).toBeVisible()
  })

  it('should load more items on scroll', async () => {
    // Tap back button if present form previous test
    try {
      await element(by.id('BackChevron')).tap()
    } catch {}

    // Load Wallet Home
    await waitForElementId('WalletHome')
    await waitForExpectNotVisible('TransactionList/loading')
    await waitFor(element(by.id('TransferFeedItem')).atIndex(0))
      .toBeVisible()
      .withTimeout(10_000)
    const startingItems = await element(by.id('TransferFeedItem')).getAttributes()

    // Scroll to bottom - Android will scroll forever so we set a static value
    await element(by.id('TransactionList')).scroll(5000, 'down')
    await sleep(5000)
    await waitForExpectNotVisible('TransactionList/loading')

    // Compare initial number of items to new number of items after scroll
    const endingItems = await element(by.id('TransferFeedItem')).getAttributes()
    jestExpect(endingItems.elements.length).toBeGreaterThan(startingItems.elements.length)
  })
}
