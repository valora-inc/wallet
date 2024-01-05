import { waitForElementByText, waitForElementById } from './_utils'
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

/**
 * Add a comment to a send transaction
 * @param {string} comment
 */
export async function addComment(comment) {
  await waitForElementById('commentInput/send')
  await element(by.id('commentInput/send')).replaceText('')
  await element(by.id('commentInput/send')).replaceText(`${comment}\n`)
  await element(by.id('commentInput/send')).tapReturnKey()
  if (device.getPlatform() === 'android') {
    // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
    // so we tap something else in the scrollview to hide the soft keyboard
    await waitForElementByIdAndTap('HeaderText')
  }
}
