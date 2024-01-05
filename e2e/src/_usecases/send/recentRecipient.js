import jestExpect from 'expect'
import {
  enterPinIfNecessary,
  waitForElementById,
  waitForElementByIdAndTap,
  waitForElementByText,
} from '../../utils/_utils'
import { reloadReactNative } from '../../utils/retries'
import { addComment, confirmTransaction } from '../../utils/send'

const faker = require('@faker-js/faker')

export default recentRecipient = () => {
  let commentText
  beforeAll(async () => {
    commentText = faker.lorem.words()
    await reloadReactNative()
  })

  it('should navigate to send search input from home action', async () => {
    await waitForElementByIdAndTap('HomeAction-Send')
    await waitForElementByText('0xe5f5...8846')
  })

  it('should be able to click on recent recipient', async () => {
    await element(by.text('0xe5f5...8846')).atIndex(0).tap()
    await waitForElementById('SendEnterAmount/Input')
  })

  it('should be able to choose token', async () => {
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
    await waitForElementByText('0xe5f5...8846')
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
}
