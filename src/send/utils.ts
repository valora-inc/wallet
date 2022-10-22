import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { call, put, select } from 'redux-saga/effects'
import { cUsdDailyLimitSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { SendOrigin } from 'src/analytics/types'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ALERT_BANNER_DURATION } from 'src/config'
import { FeeType } from 'src/fees/reducer'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { E164NumberToAddressType, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { RecipientVerificationStatus } from 'src/identity/types'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import {
  convertCurrencyToLocalAmount,
  convertDollarsToLocalAmount,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import {
  getLocalCurrencySymbol,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, uriDataFromUrl } from 'src/qrcode/schema'
import { AddressRecipient, Recipient } from 'src/recipients/recipient'
import { updateValoraRecipientCache } from 'src/recipients/reducer'
import { PaymentInfo } from 'src/send/reducers'
import { getRecentPayments } from 'src/send/selectors'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransactionDataInput as TransactionDataInputLegacy } from 'src/send/SendConfirmationLegacy'
import { TokenBalance } from 'src/tokens/reducer'
import { tokensListSelector } from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { timeDeltaInHours } from 'src/utils/time'

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

export const getFeeType = (
  recipientVerificationStatus: RecipientVerificationStatus
): FeeType | null => {
  switch (recipientVerificationStatus) {
    case RecipientVerificationStatus.UNKNOWN:
      return null
    case RecipientVerificationStatus.UNVERIFIED:
      return FeeType.INVITE
    case RecipientVerificationStatus.VERIFIED:
      return FeeType.SEND
  }
}

// exported for tests
export function dailyAmountRemaining(
  now: number,
  recentPayments: PaymentInfo[],
  dailyLimit: number
) {
  return dailyLimit - dailySpent(now, recentPayments)
}

function dailySpent(now: number, recentPayments: PaymentInfo[]) {
  // We are only interested in the last 24 hours
  const paymentsLast24Hours = recentPayments.filter(
    (p: PaymentInfo) => timeDeltaInHours(now, p.timestamp) < 24
  )

  const amount: number = paymentsLast24Hours.reduce((sum, p: PaymentInfo) => sum + p.amount, 0)
  return amount
}

/**
 * Everything in this function is mapped to dollar amounts
 */
export function useDailyTransferLimitValidator(
  amount: BigNumber | null,
  currency: Currency
): [boolean, () => void] {
  const dispatch = useDispatch()

  const localExchangeRates = useSelector(localCurrencyExchangeRatesSelector)

  const dollarAmount = useMemo(() => {
    if (currency === Currency.Dollar) {
      return amount
    }
    const localAmount = convertCurrencyToLocalAmount(amount, localExchangeRates[currency])
    return convertLocalAmountToDollars(localAmount, localExchangeRates[Currency.Dollar])
  }, [amount, currency])

  const recentPayments = useSelector(getRecentPayments)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const dailyLimitCusd = useSelector(cUsdDailyLimitSelector)

  const now = Date.now()

  const isLimitReached =
    dollarAmount === null ||
    _isPaymentLimitReached(now, recentPayments, dollarAmount.toNumber(), dailyLimitCusd)
  const showLimitReachedBanner = () => {
    dispatch(
      showLimitReachedError(
        now,
        recentPayments,
        localExchangeRates[Currency.Dollar],
        localCurrencySymbol,
        dailyLimitCusd
      )
    )
  }
  return [isLimitReached, showLimitReachedBanner]
}

export function _isPaymentLimitReached(
  now: number,
  recentPayments: PaymentInfo[],
  initial: number,
  dailyLimitCusd: number
): boolean {
  const amount = dailySpent(now, recentPayments) + initial
  return amount > dailyLimitCusd
}

export function showLimitReachedError(
  now: number,
  recentPayments: PaymentInfo[],
  localCurrencyExchangeRate: string | null | undefined,
  localCurrencySymbol: LocalCurrencySymbol | null,
  dailyLimitCusd: number
) {
  const dailyRemainingcUSD = dailyAmountRemaining(now, recentPayments, dailyLimitCusd).toFixed(2)
  const dailyRemaining = convertDollarsToLocalAmount(
    dailyRemainingcUSD,
    localCurrencyExchangeRate
  )?.decimalPlaces(2)
  const dailyLimit = convertDollarsToLocalAmount(
    dailyLimitCusd,
    localCurrencyExchangeRate
  )?.decimalPlaces(2)

  const translationParams = {
    currencySymbol: localCurrencySymbol,
    dailyRemaining,
    dailyLimit,
    dailyRemainingcUSD,
    dailyLimitcUSD: dailyLimitCusd,
  }

  return showError(ErrorMessages.PAYMENT_LIMIT_REACHED, ALERT_BANNER_DURATION, translationParams)
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

  navigate(Screens.SendAmount, {
    forceInputAmount: data.amount > 0 ? data.amount : undefined,
    recipient,
    isFromScan,
    isOutgoingPaymentRequest,
    origin: SendOrigin.AppSendFlow,
    forceTokenAddress: data.token ? tokenInfo?.address : undefined,
  })
}

export function* handlePaymentDeeplink(deeplink: string) {
  try {
    const paymentData = uriDataFromUrl(deeplink)
    yield call(handleSendPaymentData, paymentData, undefined, undefined, true)
  } catch (e) {
    Logger.warn('handlePaymentDeepLink', `deeplink ${deeplink} failed with ${e}`)
  }
}

export function isLegacyTransactionData(
  transactionData: TransactionDataInput | TransactionDataInputLegacy
): transactionData is TransactionDataInputLegacy {
  return transactionData && 'currency' in transactionData
}
