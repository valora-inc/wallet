// clicks an element if it sees it
async function bannerDismiss(inElement, tapElement) {
  try {
    await waitFor(element(inElement))
      .toBeVisible()
      .withTimeout(1000)
    if (tapElement) {
      await element(tapElement).tap()
    } else {
      await element(inElement).tap()
    }
  } catch (e) {
    // TODO take a screenshot
  }
}

export async function dismissBanners() {
  // Dismiss firebase error - remove when firebase is enabled for testing
  await bannerDismiss(by.id('ErrorIcon'))
  await bannerDismiss(by.id('SmartTopAlertButton'))
}
