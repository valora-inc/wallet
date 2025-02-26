import { launchApp } from '../utils/retries'

export default HandleNotification = () => {
  // firebase is currently not enabled for e2e tests so the below test is skipped.
  it.skip('Launch app from push notification', async () => {
    const userNotification = {
      trigger: {
        type: 'push',
      },
      title: 'From push',
      subtitle: 'Subtitle',
      body: 'Body',
      badge: 1,
      payload: {
        ou: 'https://celo.org',
      },
      category: 'org.celo.mobile.test',
      'content-available': 0,
      'action-identifier': 'default',
    }

    await launchApp({ userNotification })
  })

  it('Launch app and deeplink to another screen', async () => {
    await launchApp({
      url: 'celo://wallet/cashIn',
      sourceApp: 'org.celo.mobile.test',
    })

    await waitFor(element(by.text('Select a Token')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })
}
