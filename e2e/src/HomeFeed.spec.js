import { launchApp } from './utils/retries'
import { quickOnboarding, sleep, waitForElementId } from './utils/utils'
import jestExpect from 'expect'

beforeAll(async () => {
  await quickOnboarding()
})

// iOS only as getAttributes on multiple elements is not supported on Android
describe(':ios: Home Feed', () => {
  it('should show correct information on tap of feed item', async () => {
    // Load Wallet Home
    await waitForElementId('WalletHome')
    const items = await element(by.id('TransferFeedItem')).getAttributes()

    // Tap top TransferFeedItem
    await element(by.id('TransferFeedItem')).atIndex(0).tap()

    // Assert on text based on elements returned earlier
    const address = items.elements[0].label.split(' ')[0]
    const amount = items.elements[0].label.match(/(\d+\.\d+)/)[1]
    await expect(element(by.text(address)).atIndex(0)).toBeVisible()
    await expect(element(by.text(`$${amount}`)).atIndex(0)).toBeVisible()
  })

  it('should load more items on scroll', async () => {
    // Tap back button if present form previous test
    try {
      await element(by.id('BackChevron')).tap()
    } catch {}

    // Load Wallet Home
    await waitForElementId('WalletHome')
    const startingItems = await element(by.id('TransferFeedItem')).getAttributes()

    // Scroll to bottom
    await element(by.id('WalletHome/SectionList')).scrollTo('bottom')
    await sleep(5000)

    // Compare initial number of items to new number of items after scroll
    const endingItems = await element(by.id('TransferFeedItem')).getAttributes()
    jestExpect(endingItems.elements.length).toBeGreaterThan(startingItems.elements.length)
  })
})
