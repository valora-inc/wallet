import { reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, waitForElementId } from '../utils/utils'

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

    // SelectProviderScreen
    try {
      // expand dropdown for "Bank Account" providers section
      await element(by.id('Bank/section')).tap()
    } catch (error) {
      // expected when only one provider exists for "Bank" fiat account type
      await expect(element(by.id('Bank/singleprovider')))
    }
    await element(by.id('image-Test Provider')).tap()
    await enterPinUiIfNecessary()

    // LinkAccountScreen
    await expect(element(by.text('Set Up Bank Account'))).toBeVisible()
    await expect(element(by.text('Terms and Conditions'))).toBeVisible()
    await expect(element(by.text('Privacy Policy'))).toBeVisible()
    await element(by.id('continueButton')).tap()

    // FiatDetailsScreen
    // assumes AccountNumber quote schema
    await expect(element(by.text('Enter Bank Information'))).toBeVisible()
    await element(by.id('input-institutionName')).replaceText('My Bank Name')
    await element(by.id('input-accountNumber')).replaceText('1234567890')
    await element(by.id('fiatDetailsScreen.submitAndContinue')).tap()

    // ReviewScreen
    await expect(element(by.text('Review'))).toBeVisible()
    await element(by.id('submitButton')).tap()

    // TransferStatusScreen
    await waitFor(element(by.id('loadingTransferStatus'))).not.toBeVisible()
    await expect(element(by.text('Your funds are on their way!'))).toBeVisible()
    await expect(element(by.text('Continue'))).toBeVisible()
    await element(by.id('Continue')).tap()

    // WalletHome
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible() // proxy for reaching home screen, imitating NewAccountOnboarding e2e test

    // TODO non-kyc transfer out
    //  need to figure out a way to trigger "first time user flow" each time thru the tests
  })
}
