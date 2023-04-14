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
  beforeEach(async () => {
    // If we end up on the ExchangeHomeScreen, we need to navigate back to the Celo screen
    try {
      await element(by.id('ExchangeHomeScreen/Info')).tap()
    } catch {}
    await waitForElementId('Education')
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
    await waitForElementId('ExchangeHomeScreen/Info')
  })

  it('should be able to complete CELO education carousel', async () => {
    await celoEducation()
    await waitForElementId('ExchangeHomeScreen')
  })
}
