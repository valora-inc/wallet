import BigNumber from 'bignumber.js'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  ALERT_BANNER_DURATION,
  DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
  DOLLAR_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import { AddressValidationType, secureSendPhoneNumberMappingSelector } from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { RecipientVerificationStatus } from 'src/identity/types'
import { convertToMaxSupportedPrecision } from 'src/localCurrency/convert'
import {
  useConvertBetweenCurrencies,
  useLocalAmountInStableCurrency,
  useStableCurrencyAmountInLocal,
} from 'src/localCurrency/hooks'
import {
  getLocalCurrencyCode,
  localCurrencyExchangeRateSelector,
} from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useRecipientVerificationStatus } from 'src/recipients/hooks'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { updateLastUsedCurrency } from 'src/send/actions'
import { TransactionDataInput } from 'src/send/SendAmount'
import { getFeeType, useDailyTransferLimitValidator } from 'src/send/utils'
import { useCurrencyBalance } from 'src/stableToken/hooks'
import { Currency } from 'src/utils/currencies'

interface Props {
  recipient: Recipient
  localAmount: BigNumber
  transferCurrency: Currency
  origin: SendOrigin
  isFromScan: boolean
}

function useTransactionCallbacks({
  recipient,
  localAmount: approximateLocalAmount,
  transferCurrency,
  origin,
  isFromScan,
}: Props) {
  const localAmount = useMemo(() => convertToMaxSupportedPrecision(approximateLocalAmount), [
    approximateLocalAmount,
  ])
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencyExchangeRate = useSelector(localCurrencyExchangeRateSelector)[transferCurrency]
  const recipientVerificationStatus = useRecipientVerificationStatus(recipient)
  const stableBalance = useCurrencyBalance(transferCurrency)
  const amountInStableCurrency =
    useLocalAmountInStableCurrency(localAmount, transferCurrency) ?? new BigNumber(0) // TODO: Handle errors better

  const dispatch = useDispatch()

  const getTransactionData = useCallback(
    (type: TokenTransactionType): TransactionDataInput => ({
      recipient,
      amount: amountInStableCurrency ?? new BigNumber(0), // TODO: Handle errors better
      currency: transferCurrency,
      type,
      reason: '',
    }),
    [recipient, amountInStableCurrency, transferCurrency]
  )

  const continueAnalyticsParams = useMemo(() => {
    return {
      origin,
      isScan: isFromScan,
      isInvite: recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED,
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      localCurrencyAmount: localAmount.toString(),
      underlyingCurrency: transferCurrency,
      underlyingAmount: amountInStableCurrency.toString(),
    }
  }, [
    origin,
    isFromScan,
    recipientVerificationStatus,
    localCurrencyExchangeRate,
    localCurrencyCode,
    localAmount,
    transferCurrency,
    amountInStableCurrency,
  ])

  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const addressValidationType: AddressValidationType = getAddressValidationType(
    recipient,
    secureSendPhoneNumberMapping
  )

  const [isTransferLimitReached, showLimitReachedBanner] = useDailyTransferLimitValidator(
    stableBalance,
    transferCurrency
  )

  const feeType = getFeeType(recipientVerificationStatus)
  const estimateFeeDollars = useSelector(getFeeEstimateDollars(feeType)) ?? new BigNumber(0)
  const estimateFeeInStableCurrency = useConvertBetweenCurrencies(
    estimateFeeDollars,
    Currency.Dollar,
    transferCurrency
  )

  const onSend = useCallback(() => {
    const newAccountBalance = stableBalance
      .minus(amountInStableCurrency)
      .minus(estimateFeeInStableCurrency ?? 0)

    const isAmountValid = localAmount.isGreaterThanOrEqualTo(DOLLAR_TRANSACTION_MIN_AMOUNT)
    const isStableTokenBalanceSufficient = isAmountValid && newAccountBalance.isGreaterThan(0)

    if (!isStableTokenBalanceSufficient) {
      dispatch(showError(ErrorMessages.NSF_TO_SEND))
      return
    }

    if (isTransferLimitReached) {
      showLimitReachedBanner()
      return
    }

    const transactionData =
      recipientVerificationStatus === RecipientVerificationStatus.VERIFIED
        ? getTransactionData(TokenTransactionType.Sent)
        : getTransactionData(TokenTransactionType.InviteSent)

    dispatch(hideAlert())
    dispatch(updateLastUsedCurrency(transferCurrency))

    if (addressValidationType !== AddressValidationType.NONE && !recipient.address) {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
        origin,
      })
    } else {
      ValoraAnalytics.track(SendEvents.send_amount_continue, continueAnalyticsParams)
      navigate(Screens.SendConfirmation, {
        transactionData,
        isFromScan,
        origin,
      })
    }
  }, [
    recipientVerificationStatus,
    addressValidationType,
    localAmount,
    stableBalance,
    transferCurrency,
    estimateFeeInStableCurrency,
    getTransactionData,
    origin,
  ])

  const defaultDailyLimitInLocalCurrency =
    useStableCurrencyAmountInLocal(
      new BigNumber(DEFAULT_DAILY_PAYMENT_LIMIT_CUSD),
      Currency.Dollar
    ) ?? DEFAULT_DAILY_PAYMENT_LIMIT_CUSD // TODO: Improve error handling
  const onRequest = useCallback(() => {
    if (localAmount.isGreaterThan(defaultDailyLimitInLocalCurrency)) {
      dispatch(
        showError(ErrorMessages.REQUEST_LIMIT, ALERT_BANNER_DURATION, {
          limit: DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
        })
      )
      return
    }
    dispatch(updateLastUsedCurrency(transferCurrency))

    const transactionData = getTransactionData(TokenTransactionType.PayRequest)

    if (addressValidationType !== AddressValidationType.NONE && !recipient.address) {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
        isOutgoingPaymentRequest: true,
        origin,
      })
    } else if (recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED) {
      ValoraAnalytics.track(RequestEvents.request_unavailable, continueAnalyticsParams)
      navigate(Screens.PaymentRequestUnavailable, { transactionData })
    } else {
      ValoraAnalytics.track(RequestEvents.request_amount_continue, continueAnalyticsParams)
      navigate(Screens.PaymentRequestConfirmation, { transactionData })
    }
  }, [addressValidationType, getTransactionData])

  return { onSend, onRequest }
}

export default useTransactionCallbacks
