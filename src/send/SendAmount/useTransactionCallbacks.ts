import BigNumber from 'bignumber.js'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { FeeType } from 'src/fees/reducer'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import { AddressValidationType } from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { secureSendPhoneNumberMappingSelector } from 'src/identity/selectors'
import { RecipientVerificationStatus } from 'src/identity/types'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import {
  getLocalCurrencyCode,
  getLocalCurrencySymbol,
  usdToLocalCurrencyRateSelector,
} from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useRecipientVerificationStatus } from 'src/recipients/hooks'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { TransactionDataInput } from 'src/send/SendAmount'
import { useTokenInfo } from 'src/tokens/hooks'
import { roundUp } from 'src/utils/formatting'

interface Props {
  recipient: Recipient
  localAmount: BigNumber | null
  tokenAmount: BigNumber
  usdAmount: BigNumber | null
  inputIsInLocalCurrency: boolean
  transferTokenId: string
  origin: SendOrigin
  isFromScan: boolean
}

// This hook returns an onSend callback, which should be called when the user presses the button to continue.
function useTransactionCallbacks({
  recipient,
  localAmount,
  tokenAmount,
  usdAmount,
  inputIsInLocalCurrency,
  transferTokenId,
  origin,
  isFromScan,
}: Props) {
  const tokenInfo = useTokenInfo(transferTokenId)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const recipientVerificationStatus = useRecipientVerificationStatus(recipient)

  const dispatch = useDispatch()

  const getTransactionData = useCallback((): TransactionDataInput => {
    return {
      recipient,
      inputAmount: inputIsInLocalCurrency ? localAmount! : tokenAmount,
      tokenAmount,
      amountIsInLocalCurrency: inputIsInLocalCurrency,
      tokenAddress: tokenInfo?.address ?? undefined,
      tokenId: transferTokenId,
    }
  }, [recipient, tokenAmount, transferTokenId, tokenInfo])

  const continueAnalyticsParams = useMemo(() => {
    return {
      origin,
      recipientType: recipient.recipientType,
      isScan: isFromScan,
      isInvite: recipientVerificationStatus !== RecipientVerificationStatus.VERIFIED,
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      localCurrencyAmount: localAmount?.toString() ?? null,
      underlyingTokenAddress: tokenInfo?.address ?? null,
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
    transferTokenId,
    tokenAmount,
    usdAmount,
  ])

  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const addressValidationType: AddressValidationType = getAddressValidationType(
    recipient,
    secureSendPhoneNumberMapping
  )

  const feeType = FeeType.SEND
  const estimateFeeDollars =
    useSelector(getFeeEstimateDollars(feeType, tokenInfo)) ?? new BigNumber(0)

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

    const transactionData = getTransactionData()

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
    transferTokenId,
    getTransactionData,
    origin,
  ])

  return { onSend }
}

export default useTransactionCallbacks
