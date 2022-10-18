import { reloadReactNative } from '../utils/retries'
import { waitForElementId } from '../utils/utils'

// const jestExpect = require('expect')

// TODO after initiating transfer out, recover funds from account with this mnemonic: https://console.cloud.google.com/security/secret-manager/secret/fiatconnect-test-walllet-mnemonic/versions?project=celo-mobile-alfajores
//  (accountAddress: 0x678AA7a27B17795917a9Dc615fE62201A51DcA95)

export const fiatConnectNonKycTransferOut = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await waitForElementId('cashOut')
    await element(by.id('cashOut')).tap()
  })
  it('First time FiatConnect cash out', async () => {
    const token = 'cUSD'
    const amount = '0.02'
    await waitForElementId(`radio/${token}`)
    await element(by.id(`radio/${token}`)).tap()
    await element(by.text('Next')).tap()
    await waitForElementId('FiatExchangeInput')
    await element(by.id('FiatExchangeInput')).replaceText(`${amount}`)
    await element(by.id('FiatExchangeNextButton')).tap()
    await expect(element(by.text('Select Withdraw Method'))).toBeVisible()
    await waitForElementId('Exchanges') // once visible, the FC providers should have also loaded

    try {
      // expand dropdown for "Bank Account" providers section
      await element(by.id('Bank/section')).tap()
    } catch (error) {
      // expected when only one provider exists for "Bank" fiat account type
      await expect(element(by.id('Bank/singleprovider')))
    }
    await element(by.id('image-Test Provider')).tap()

    // TODO non-kyc transfer out
    //  need to figure out a way to trigger "first time user flow" each time thru the tests
  })
}
