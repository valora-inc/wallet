import { quickOnboarding, waitForElementById, waitForElementByIdAndTap } from '../../utils/_utils'
import { launchApp, reloadReactNative } from '../../utils/retries'

describe('Resolutions', () => {
  beforeAll(async () => {
    await launchApp({
      launchArgs: {
        statsigGateOverrides: 'use_new_send_flow=true,use_viem_for_send=true',
      },
      permissions: { contacts: 'YES' },
    })
    await quickOnboarding()
  })

  beforeEach(async () => {
    await reloadReactNative()
    await waitForElementByIdAndTap('HomeAction-Send')
    await waitForElementById('SendSelectRecipientSearchInput')
  })

  it('should be able to enter a .nom space', async () => {
    await element(by.id('SendSelectRecipientSearchInput')).tap()
    await element(by.id('SendSelectRecipientSearchInput')).replaceText('Hello.nom')
    await waitForElementById('RecipientItem')
  })
})
