import { isElementExistant } from '../utils/utils'

// clicks an element if it sees it
async function bannerDismiss(inElement, tapElement) {
  try {
    await waitFor(element(inElement))
      .toBeVisible()
      .withTimeout(500)
    if (tapElement) {
      await element(tapElement).tap()
    } else {
      await element(inElement).tap()
    }
  } catch (e) {
    // TODO take a screenshot
  }
}

// Dismiss firebase error - remove when firebase is enabled for testing
export async function errorDismiss() {
  if (isElementExistant(element(by.id('ErrorIcon')))) {
    try {
      await waitFor(element(by.id('ErrorIcon')))
        .toBeVisible()
        .withTimeout(1000)
      await element(by.id('ErrorIcon')).tap()
    } catch (e) {}
  }
}

export default dismissBanners = async () => {
  await bannerDismiss(by.id('errorBanner'))
  await bannerDismiss(by.id('SmartTopAlertButton'))
}
