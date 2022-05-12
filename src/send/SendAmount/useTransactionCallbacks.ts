import BigNumber from 'bignumber.js'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import { AddressValidationType } from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { secureSendPhoneNumberMappingSelector } from 'src/identity/selectors'
import { RecipientVerificationStatus } from 'src/identity/types'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
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
import { useTokenInfo } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'
import { roundUp } from 'src/utils/formatting'

interface Props {
  recipient: Recipient
  localAmount: BigNumber | null
  tokenAmount: BigNumber
  usdAmount: BigNumber | null
  inputIsInLocalCurrency: boolean
  transferTokenAddress: string
  origin: SendOrigin
  isFromScan: boolean
}

// This hook returns two functions, onSend and onRequest that should be called when the user presses the button to continue.
function useTransactionCallbacks({
  recipient,
  localAmount,
  tokenAmount,
  usdAmount,
  inputIsInLocalCurrency,
  transferTokenAddress,
  origin,
  isFromScan,
}: Props) {
  const tokenInfo = useTokenInfo(transferTokenAddress)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyExchangeRate = useSelector(localCurrencyToUsdSelector)
  const recipientVerificationStatus = useRecipientVerificationStatus(recipient)

  const dispatch = useDispatch()

  const getTransactionData = useCallback(
    (type: TokenTransactionType): TransactionDataInput => ({
      recipient,
      inputAmount: inputIsInLocalCurrency ? localAmount! : tokenAmount,
      tokenAmount,
      amountIsInLocalCurrency: inputIsInLocalCurrency,
      tokenAddress: transferTokenAddress,
    }),
    [recipient, tokenAmount, transferTokenAddress]
  )

  const continueAnalyticsParams = useMemo(() => {
    return {
      origin,
      recipientType: recipient.recipientType,
      isScan: isFromScan,
      isInvite: recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED,
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      localCurrencyAmount: localAmount?.toString() ?? null,
      underlyingTokenAddress: transferTokenAddress,
      underlyingTokenSymbol: tokenInfo?.symbol ?? '',
      underlyingAmount: tokenAmount.toString(),
      amountInUsd: usdAmount?.toString() ?? null,
    }
  }, [
    origin,
    isFromScan,
    recipientVerificationStatus,
    localCurrencyExchangeRate,
    localCurrencyCode,
    localAmount,
    transferTokenAddress,
    tokenAmount,
    usdAmount,
  ])

  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const addressValidationType: AddressValidationType = getAddressValidationType(
    recipient,
    secureSendPhoneNumberMapping
  )

  const [isTransferLimitReached, showLimitReachedBanner] = useDailyTransferLimitValidator(
    usdAmount,
    Currency.Dollar
  )

  const feeType = getFeeType(recipientVerificationStatus)
  const estimateFeeDollars =
    useSelector(getFeeEstimateDollars(feeType, transferTokenAddress)) ?? new BigNumber(0)

  const minimumAmount = roundUp(usdAmount?.plus(estimateFeeDollars) ?? estimateFeeDollars)

  const onSend = useCallback(() => {
    // This should never happen, doing this check to satisfy Typescript.
    if (!tokenInfo?.balance) {
      dispatch(showError(ErrorMessages.FETCH_FAILED))
      return null
    }

    const isAmountValid = localAmount?.isGreaterThanOrEqualTo(STABLE_TRANSACTION_MIN_AMOUNT) ?? true
    const isTokenBalanceSufficient = isAmountValid && tokenAmount.lte(tokenInfo.balance)

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

    if (isTransferLimitReached && usdAmount) {
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

  const onRequest = useCallback(() => {
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
