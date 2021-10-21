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
  STABLE_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import { AddressValidationType, secureSendPhoneNumberMappingSelector } from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { RecipientVerificationStatus } from 'src/identity/types'
import {
  convertDollarsToLocalAmount,
  convertToMaxSupportedPrecision,
} from 'src/localCurrency/convert'
import { useCurrencyToLocalAmount, useLocalAmountToCurrency } from 'src/localCurrency/hooks'
import {
  getLocalCurrencyCode,
  getLocalCurrencySymbol,
  localCurrencyToUsdSelector,
} from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useRecipientVerificationStatus } from 'src/recipients/hooks'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { TransactionDataInput } from 'src/send/SendAmount'
import { getFeeType, useDailyTransferLimitValidator } from 'src/send/utils'
import { useLocalToTokenAmount, useTokenInfo } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'
import { roundUp } from 'src/utils/formatting'

interface Props {
  recipient: Recipient
  localAmount: BigNumber
  transferTokenAddress: string
  origin: SendOrigin
  isFromScan: boolean
}

// This hook returns two functions, onSend and onRequest that should be called when the user presses the button to continue.
function useTransactionCallbacks({
  recipient,
  localAmount: approximateLocalAmount,
  transferTokenAddress,
  origin,
  isFromScan,
}: Props) {
  const localAmount = useMemo(() => convertToMaxSupportedPrecision(approximateLocalAmount), [
    approximateLocalAmount,
  ])
  const tokenInfo = useTokenInfo(transferTokenAddress)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyExchangeRate = useSelector(localCurrencyToUsdSelector)
  const recipientVerificationStatus = useRecipientVerificationStatus(recipient)
  const amountInToken = useLocalToTokenAmount(localAmount, transferTokenAddress)
  const amountInUsd = useLocalAmountToCurrency(localAmount, Currency.Dollar)

  const dispatch = useDispatch()

  const getTransactionData = useCallback(
    (type: TokenTransactionType): TransactionDataInput => ({
      recipient,
      amount: amountInToken!,
      tokenAddress: transferTokenAddress,
      type,
      reason: '',
    }),
    [recipient, amountInToken, transferTokenAddress]
  )

  const continueAnalyticsParams = useMemo(() => {
    return {
      origin,
      isScan: isFromScan,
      isInvite: recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED,
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      localCurrencyAmount: localAmount.toString(),
      underlyingTokenAddress: transferTokenAddress,
      underlyingTokenSymbol: tokenInfo?.symbol ?? '',
      underlyingAmount: amountInToken?.toString() ?? '',
      amountInUsd: amountInUsd?.toString() ?? '',
    }
  }, [
    origin,
    isFromScan,
    recipientVerificationStatus,
    localCurrencyExchangeRate,
    localCurrencyCode,
    localAmount,
    transferTokenAddress,
    amountInToken,
    amountInUsd,
  ])

  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const addressValidationType: AddressValidationType = getAddressValidationType(
    recipient,
    secureSendPhoneNumberMapping
  )

  const [isTransferLimitReached, showLimitReachedBanner] = useDailyTransferLimitValidator(
    amountInUsd,
    Currency.Dollar
  )

  const feeType = getFeeType(recipientVerificationStatus)
  const estimateFeeDollars = useSelector(getFeeEstimateDollars(feeType)) ?? new BigNumber(0)

  const minimumAmount = roundUp(estimateFeeDollars ?? 0, 2)

  const onSend = useCallback(() => {
    if (!tokenInfo?.balance || !amountInToken) {
      dispatch(showError(ErrorMessages.FETCH_FAILED))
      return null
    }

    const isAmountValid = localAmount.isGreaterThanOrEqualTo(STABLE_TRANSACTION_MIN_AMOUNT)
    const isTokenBalanceSufficient = isAmountValid && amountInToken.lte(tokenInfo.balance)

    console.log(amountInToken.toString(), tokenInfo.balance.toString())
    if (!isTokenBalanceSufficient) {
      const localAmountNeeded = convertDollarsToLocalAmount(
        minimumAmount,
        localCurrencyExchangeRate
      )
      dispatch(
        showError(ErrorMessages.NSF_TO_SEND, null, {
          amountNeeded: localAmountNeeded,
          currencySymbol: localCurrencySymbol,
        })
      )
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
    tokenInfo?.balance,
    transferTokenAddress,
    getTransactionData,
    origin,
  ])

  const defaultDailyLimitInLocalCurrency = useCurrencyToLocalAmount(
    new BigNumber(DEFAULT_DAILY_PAYMENT_LIMIT_CUSD),
    Currency.Dollar
  )

  const onRequest = useCallback(() => {
    if (!tokenInfo?.balance || !amountInToken || !defaultDailyLimitInLocalCurrency) {
      dispatch(showError(ErrorMessages.FETCH_FAILED))
      return null
    }

    if (localAmount.isGreaterThan(defaultDailyLimitInLocalCurrency)) {
      dispatch(
        showError(ErrorMessages.REQUEST_LIMIT, ALERT_BANNER_DURATION, {
          limit: DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
        })
      )
      return
    }

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
