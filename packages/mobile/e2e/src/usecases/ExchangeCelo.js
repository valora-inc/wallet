import { enterPinUiIfNecessary } from '../utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { celoEducation } from '../utils/celoEducation'

const CELO_TO_EXCHANGE = 1.1
const CELO_TO_SEND = '0.001'

export default ExchangeCelo = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    try {
      await waitFor(element(by.id('ErrorIcon')))
        .toBeVisible()
        .withTimeout(1000)
      await element(by.id('ErrorIcon')).tap()
    } catch (e) {}
    await element(by.id('Hamburguer')).tap()
    await element(by.id('CELO')).tap()
  })

  it('Go to CELO screen and through education flow', async () => {
    await celoEducation()
  })

  it('Buy CELO', async () => {
    await waitFor(element(by.text('Buy')))
      .toBeVisible()
      .withTimeout(30000)
    // await expect(element(by.id('BuyCelo'))).toBeVisible()

    // Tap on the buy button, fill the amount, review and confirm.
    await element(by.text('Buy')).tap()
    await waitFor(element(by.id('Exchange')))
      .toBeVisible()
      .withTimeout(3000)
    await element(by.id('ExchangeInput')).replaceText(CELO_TO_EXCHANGE.toString())
    await element(by.id('ExchangeReviewButton')).tap()
    await element(by.id('ConfirmExchange')).tap()

    await enterPinUiIfNecessary()

    // Return to the Exchange CELO screen and check balance
    // await expect(element(by.text('Purchased')).atIndex(0)).toBeVisible()
    // await expect(element(by.text(`${CELO_TO_EXCHANGE}`).atIndex(0))).toBeVisible();
  })

  it('Sell CELO', async () => {
    // Tap on the sell button, fill the amount, review and confirm.
    await element(by.text('Sell')).tap()
    await element(by.id('ExchangeInput')).replaceText(CELO_TO_EXCHANGE.toString())
    await element(by.id('ExchangeReviewButton')).tap()
    await element(by.id('ConfirmExchange')).tap()

    await enterPinUiIfNecessary()

    // Return to the Exchange CELO screen.
    // await expect(element(by.text('Sold')).atIndex(0)).toBeVisible();
    // await expect(element(by.text(`-${CELO_TO_EXCHANGE}`)).atIndex(0)).toBeVisible();
  })

  it('Withdraw CELO', async () => {
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .whileElement(by.id('ExchangeScrollView'))
      .scroll(50, 'down')

    // Tap on withdraw, fill data, review and confirm.
    await element(by.id('WithdrawCELO')).tap()
    await waitFor(element(by.id('AccountAddress')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('CeloAmount')).replaceText(CELO_TO_SEND)
    await element(by.id('WithdrawReviewButton')).tap()
    await waitFor(element(by.id('ConfirmWithdrawButton')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('ConfirmWithdrawButton')).tap()

    await enterPinUiIfNecessary()

    // Return to the Exchange CELO screen after confirming.
    await expect(element(by.id('BuyCelo'))).toBeVisible()
  })
}
