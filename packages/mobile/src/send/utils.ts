import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { call, put, select } from 'redux-saga/effects'
import { cUsdDailyLimitSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { SendOrigin } from 'src/analytics/types'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { multiTokenUseSendFlowSelector } from 'src/app/selectors'
import { ALERT_BANNER_DURATION } from 'src/config'
import { FeeType } from 'src/fees/reducer'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { E164NumberToAddressType, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { RecipientVerificationStatus } from 'src/identity/types'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import {
  convertCurrencyToLocalAmount,
  convertDollarsToLocalAmount,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import { fetchExchangeRate } from 'src/localCurrency/saga'
import {
  getLocalCurrencyCode,
  getLocalCurrencySymbol,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, uriDataFromUrl } from 'src/qrcode/schema'
import { AddressRecipient, Recipient } from 'src/recipients/recipient'
import { updateValoraRecipientCache } from 'src/recipients/reducer'
import { PaymentInfo } from 'src/send/reducers'
import { canSendTokensSelector, getRecentPayments } from 'src/send/selectors'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransactionDataInput as TransactionDataInputLegacy } from 'src/send/SendAmountLegacy'
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

function* handleSendPaymentDataLegacy(
  data: UriData,
  recipient: Recipient,
  isOutgoingPaymentRequest?: boolean,
  isFromScan?: boolean
) {
  if (data.amount) {
    if (data.token === 'CELO') {
      navigate(Screens.WithdrawCeloReviewScreen, {
        amount: new BigNumber(data.amount),
        recipientAddress: data.address.toLowerCase(),
        feeEstimate: new BigNumber(0),
        isCashOut: false,
      })
    } else if (data.token === 'cUSD' || !data.token) {
      const currency: LocalCurrencyCode = data.currencyCode
        ? (data.currencyCode as LocalCurrencyCode)
        : yield select(getLocalCurrencyCode)
      const exchangeRate: string = yield call(fetchExchangeRate, Currency.Dollar, currency)
      const dollarAmount = convertLocalAmountToDollars(data.amount, exchangeRate)
      if (!dollarAmount) {
        Logger.warn(TAG, '@handleSendPaymentData null amount')
        return
      }
      const transactionData: TransactionDataInputLegacy = {
        recipient,
        amount: dollarAmount,
        currency: Currency.Dollar,
        reason: data.comment,
        type: TokenTransactionType.PayPrefill,
      }
      navigate(Screens.SendConfirmationLegacy, {
        transactionData,
        isFromScan,
        currencyInfo: { localCurrencyCode: currency, localExchangeRate: exchangeRate },
        origin: SendOrigin.AppSendFlow,
      })
    }
  } else {
    if (data.token === 'CELO') {
      Logger.warn(TAG, '@handleSendPaymentData no amount given in CELO withdrawal')
      return
    } else if (data.token === 'cUSD' || !data.token) {
      navigate(Screens.SendAmountLegacy, {
        recipient,
        isFromScan,
        isOutgoingPaymentRequest,
        origin: SendOrigin.AppSendFlow,
      })
    }
  }
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

  const useTokenSendFlow: boolean = yield select(multiTokenUseSendFlowSelector)
  if (!useTokenSendFlow) {
    yield call(handleSendPaymentDataLegacy, data, recipient, isOutgoingPaymentRequest, isFromScan)
    return
  }

  const tokens: TokenBalance[] = yield select(tokensListSelector)
  const tokenInfo = tokens.find((token) => token?.symbol === (data.token ?? Currency.Dollar))

  if (data.amount && tokenInfo?.address) {
    const currency: LocalCurrencyCode = data.currencyCode
      ? (data.currencyCode as LocalCurrencyCode)
      : yield select(getLocalCurrencyCode)
    const exchangeRate: string = yield call(fetchExchangeRate, Currency.Dollar, currency)
    const dollarAmount = convertLocalAmountToDollars(data.amount, exchangeRate)
    if (!dollarAmount) {
      Logger.warn(TAG, '@handleSendPaymentData null amount')
      return
    }
    const transactionData: TransactionDataInput = {
      recipient,
      inputAmount: new BigNumber(data.amount),
      amountIsInLocalCurrency: false,
      tokenAddress: tokenInfo.address,
    }
    navigate(Screens.SendConfirmation, {
      transactionData,
      isFromScan,
      origin: SendOrigin.AppSendFlow,
    })
  } else {
    const canSendTokens: boolean = yield select(canSendTokensSelector)
    if (!canSendTokens) {
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
