import { waitForElementByIdAndTap, waitForElementId } from '../utils/utils'
import { celoEducation } from '../utils/celoEducation'

const swipeThrough = async (direction = 'left', swipes = 3) => {
  for (let i = 0; i < swipes; i++) {
    await element(by.id('ScrollContainer')).swipe(direction)
  }
}

const tapThrough = async (direction = 'forward', steps = 3) => {
  if (direction === 'forward') {
    for (let i = 0; i < steps; i++) {
      await waitForElementByIdAndTap('Education/progressButton')
    }
  } else {
    for (let i = 0; i < steps; i++) {
      await waitForElementByIdAndTap('Education/BackIcon')
    }
  }
}

const progressButtonCheck = async (text = 'Next', timeout = 10 * 1000) => {
  await waitFor(element(by.text(text).withAncestor(by.id('Education/progressButton'))))
    .toBeVisible()
    .withTimeout(timeout)
}

export default CeloEducation = () => {
  beforeAll(async () => {
    await waitForElementByIdAndTap('WalletHome/NotificationBell')
    await waitForElementId('NotificationView/celo_asset_education')
    await element(
      by.text('Learn More').withAncestor(by.id('NotificationView/celo_asset_education'))
    ).tap()
  })

  it('should be able to navigate with swipes', async () => {
    await swipeThrough()
    await waitForElementId('Education/BackIcon')
    await progressButtonCheck('Done')
    await swipeThrough('right')
    await waitForElementId('Education/CloseIcon')
    await progressButtonCheck('Next')
  })

  it("should be able to navigate with 'Next' & 'Back' button taps", async () => {
    await tapThrough()
    await progressButtonCheck('Done')
    await tapThrough('back')
    await waitForElementId('Education/CloseIcon')
    await progressButtonCheck('Next')
  })

  it('should be able to close CELO education carousel', async () => {
    await waitForElementByIdAndTap('Education/CloseIcon')
    await waitForElementId('NotificationView/celo_asset_education')
  })

  it('should be able to complete CELO education carousel', async () => {
    await element(
      by.text('Learn More').withAncestor(by.id('NotificationView/celo_asset_education'))
    ).tap()
    await celoEducation()
    await waitForElementId('Tab/Home')
  })
}
