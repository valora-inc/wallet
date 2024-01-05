import { waitForElementByText } from './_utils'
import jestExpect from 'expect'

/**
 * Confirms a transaction by checking that the comment is present in the feed and navigating to the transaction details
 * @param {string} commentText
 */
export async function confirmTransaction(commentText) {
  try {
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
  } catch (error) {
    throw new Error(`utils/confirmTransaction failed: ${error}`)
  }
}
