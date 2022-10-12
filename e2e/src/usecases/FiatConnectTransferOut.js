import { reloadReactNative } from '../utils/retries'
import { waitForElementId } from '../utils/utils'

// const jestExpect = require('expect')

export const fiatConnectTransferOut = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await waitForElementId('cashOut')
    await element(by.id('cashOut')).tap()
  })
  it('does stuff', async () => {
    const token = 'cUSD'
    const amount = '0.02'
    await waitForElementId(`radio/${token}`)
    await element(by.id(`radio/${token}`)).tap()
    await element(by.text('Next')).tap()
    await waitForElementId('FiatExchangeInput')
    await element(by.id('FiatExchangeInput')).replaceText(`${amount}`)
    await element(by.id('FiatExchangeNextButton')).tap()
    await expect(element(by.text('Select Withdraw Method'))).toBeVisible()
    // TODO non-kyc transfer out
    //  need to figure out a way to trigger "first time user flow" each time thru the tests. maybe by generating a
    //  new wallet and funding it with a "faucet" wallet?
  })
}
