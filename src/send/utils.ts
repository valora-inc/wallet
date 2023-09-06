import { SendOrigin } from 'src/analytics/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount, convertLocalAmountToDollars } from 'src/localCurrency/convert'
import { fetchExchangeRate } from 'src/localCurrency/saga'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, uriDataFromUrl } from 'src/qrcode/schema'
import { AddressRecipient, Recipient, RecipientType } from 'src/recipients/recipient'
import { updateValoraRecipientCache } from 'src/recipients/reducer'
import { canSendTokensSelector } from 'src/send/selectors'
import { TransactionDataInput } from 'src/send/SendAmount'
import { tokensListSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { call, put, select } from 'typed-redux-saga'

const TAG = 'send/utils'

export function* handleSendPaymentData(
  data: UriData,
  isFromScan: boolean,
  cachedRecipient?: Recipient,
  isOutgoingPaymentRequest?: boolean
) {
  const recipient: AddressRecipient = {
    address: data.address.toLowerCase(),
    name: data.displayName || cachedRecipient?.name,
    e164PhoneNumber: data.e164PhoneNumber,
    displayNumber: cachedRecipient?.displayNumber,
    thumbnailPath: cachedRecipient?.thumbnailPath,
    contactId: cachedRecipient?.contactId,
    recipientType: RecipientType.Address,
  }
  yield* put(
    updateValoraRecipientCache({
      [data.address.toLowerCase()]: recipient,
    })
  )

  const tokens: TokenBalance[] = yield* select(tokensListSelector)
  const tokenInfo = tokens.find((token) => token?.symbol === (data.token ?? Currency.Dollar))

  if (!tokenInfo?.usdPrice) {
    navigate(Screens.SendAmount, {
      recipient,
      isFromScan,
      isOutgoingPaymentRequest,
      origin: SendOrigin.AppSendFlow,
      defaultTokenOverride: data.token ? tokenInfo?.address : undefined,
      forceTokenAddress: !!(data.token && tokenInfo?.address),
    })
    return
  }

  if (data.amount && tokenInfo?.address) {
    const currency: LocalCurrencyCode = data.currencyCode
      ? (data.currencyCode as LocalCurrencyCode)
      : yield* select(getLocalCurrencyCode)
    const exchangeRate: string = yield* call(fetchExchangeRate, Currency.Dollar, currency)
    const dollarAmount = convertLocalAmountToDollars(data.amount, exchangeRate)
    const localCurrencyExchangeRate: string | null = yield* select(usdToLocalCurrencyRateSelector)
    const inputAmount = convertDollarsToLocalAmount(dollarAmount, localCurrencyExchangeRate)
    const tokenAmount = dollarAmount?.times(tokenInfo.usdPrice)
    if (!inputAmount || !tokenAmount) {
      Logger.warn(TAG, '@handleSendPaymentData null amount')
      return
    }
    const transactionData: TransactionDataInput = {
      recipient,
      inputAmount,
      amountIsInLocalCurrency: true,
      tokenAddress: tokenInfo.address,
      tokenAmount,
      comment: data.comment,
    }
    navigate(Screens.SendConfirmation, {
      transactionData,
      isFromScan,
      origin: SendOrigin.AppSendFlow,
    })
  } else {
    const canSendTokens: boolean = yield* select(canSendTokensSelector)
    if (!canSendTokens && !isOutgoingPaymentRequest) {
      throw new Error("Precondition failed: Can't send tokens from payment data")
    }
    navigate(Screens.SendAmount, {
      recipient,
      isFromScan,
      isOutgoingPaymentRequest,
      origin: SendOrigin.AppSendFlow,
      defaultTokenOverride: data.token ? tokenInfo?.address : undefined,
      forceTokenAddress: !!(data.token && tokenInfo?.address),
    })
  }
}

export function* handlePaymentDeeplink(deeplink: string) {
  try {
    const paymentData = uriDataFromUrl(deeplink)
    yield* call(handleSendPaymentData, paymentData, true)
  } catch (e) {
    Logger.warn('handlePaymentDeepLink', `deeplink ${deeplink} failed with ${e}`)
  }
}
