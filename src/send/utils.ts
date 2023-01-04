import BigNumber from 'bignumber.js'
import { call, put, select } from 'redux-saga/effects'
import { SendOrigin } from 'src/analytics/types'
import { TokenTransactionType } from 'src/apollo/types'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { E164NumberToAddressType, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount, convertLocalAmountToDollars } from 'src/localCurrency/convert'
import { fetchExchangeRate } from 'src/localCurrency/saga'
import { getLocalCurrencyCode, localCurrencyToUsdSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, uriDataFromUrl } from 'src/qrcode/schema'
import { AddressRecipient, Recipient } from 'src/recipients/recipient'
import { updateValoraRecipientCache } from 'src/recipients/reducer'
import { canSendTokensSelector } from 'src/send/selectors'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransactionDataInput as TransactionDataInputLegacy } from 'src/send/SendConfirmationLegacy'
import { tokensListSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

const TAG = 'send/utils'

export interface ConfirmationInput {
  recipient: Recipient
  amount: BigNumber
  currency: Currency
  reason?: string
  recipientAddress: string | null | undefined
  type: TokenTransactionType
  firebasePendingRequestUid?: string | null
}

export const getConfirmationInput = (
  transactionData: TransactionDataInputLegacy,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
): ConfirmationInput => {
  const { recipient } = transactionData
  let recipientAddress: string | null | undefined

  if (recipient.address) {
    recipientAddress = recipient.address
  } else if (recipient.e164PhoneNumber) {
    recipientAddress = getAddressFromPhoneNumber(
      recipient.e164PhoneNumber,
      e164NumberToAddress,
      secureSendPhoneNumberMapping,
      undefined
    )
  }

  return { ...transactionData, recipientAddress }
}

export function* handleSendPaymentData(
  data: UriData,
  cachedRecipient?: Recipient,
  isOutgoingPaymentRequest?: boolean,
  isFromScan?: boolean
) {
  const recipient: AddressRecipient = {
    address: data.address.toLowerCase(),
    name: data.displayName || cachedRecipient?.name,
    e164PhoneNumber: data.e164PhoneNumber,
    displayNumber: cachedRecipient?.displayNumber,
    thumbnailPath: cachedRecipient?.thumbnailPath,
    contactId: cachedRecipient?.contactId,
  }
  yield put(
    updateValoraRecipientCache({
      [data.address.toLowerCase()]: recipient,
    })
  )

  const tokens: TokenBalance[] = yield select(tokensListSelector)
  const tokenInfo = tokens.find((token) => token?.symbol === (data.token ?? Currency.Dollar))

  if (!tokenInfo?.usdPrice) {
    navigate(Screens.SendAmount, {
      recipient,
      isFromScan,
      isOutgoingPaymentRequest,
      origin: SendOrigin.AppSendFlow,
      forceTokenAddress: data.token ? tokenInfo?.address : undefined,
    })
    return
  }

  if (data.amount && tokenInfo?.address) {
    const currency: LocalCurrencyCode = data.currencyCode
      ? (data.currencyCode as LocalCurrencyCode)
      : yield select(getLocalCurrencyCode)
    const exchangeRate: string = yield call(fetchExchangeRate, Currency.Dollar, currency)
    const dollarAmount = convertLocalAmountToDollars(data.amount, exchangeRate)
    const localCurrencyExchangeRate: string | null = yield select(localCurrencyToUsdSelector)
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
    const canSendTokens: boolean = yield select(canSendTokensSelector)
    if (!canSendTokens && !isOutgoingPaymentRequest) {
      throw new Error("Precondition failed: Can't send tokens from payment data")
    }
    navigate(Screens.SendAmount, {
      recipient,
      isFromScan,
      isOutgoingPaymentRequest,
      origin: SendOrigin.AppSendFlow,
      forceTokenAddress: data.token ? tokenInfo?.address : undefined,
    })
  }
}

export function* handlePaymentDeeplink(deeplink: string) {
  try {
    const paymentData = uriDataFromUrl(deeplink)
    yield call(handleSendPaymentData, paymentData)
  } catch (e) {
    Logger.warn('handlePaymentDeepLink', `deeplink ${deeplink} failed with ${e}`)
  }
}

export function isLegacyTransactionData(
  transactionData: TransactionDataInput | TransactionDataInputLegacy
): transactionData is TransactionDataInputLegacy {
  return transactionData && 'currency' in transactionData
}
