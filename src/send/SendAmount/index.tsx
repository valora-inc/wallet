import { parseInputAmount } from '@celo/utils/lib/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import AmountKeypad from 'src/components/AmountKeypad'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import {
  ALERT_BANNER_DURATION,
  NUMBER_INPUT_MAX_DECIMALS,
  STABLE_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import { useMaxSendAmount } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import { RecipientVerificationStatus } from 'src/identity/types'
import { convertToMaxSupportedPrecision } from 'src/localCurrency/convert'
import { useCurrencyToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useRecipientVerificationStatus } from 'src/recipients/hooks'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import SendAmountHeader from 'src/send/SendAmount/SendAmountHeader'
import SendAmountValue from 'src/send/SendAmount/SendAmountValue'
import useTransactionCallbacks from 'src/send/SendAmount/useTransactionCallbacks'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import variables from 'src/styles/variables'
import {
  useAmountAsUsd,
  useLocalToTokenAmount,
  useTokenInfo,
  useTokenToLocalAmount,
} from 'src/tokens/hooks'
import { defaultTokenToSendSelector, stablecoinsSelector } from 'src/tokens/selectors'
import { fetchTokenBalances } from 'src/tokens/slice'
import { Currency } from 'src/utils/currencies'

const MAX_ESCROW_VALUE = new BigNumber(20)
const LOCAL_CURRENCY_MAX_DECIMALS = 2
const TOKEN_MAX_DECIMALS = 8

export interface TransactionDataInput {
  recipient: Recipient
  inputAmount: BigNumber
  amountIsInLocalCurrency: boolean
  tokenAddress: string
  tokenAmount: BigNumber
  comment?: string
}

type RouteProps = StackScreenProps<StackParamList, Screens.SendAmount>
type Props = RouteProps

const { decimalSeparator } = getNumberFormatSettings()

export function useInputAmounts(
  inputAmount: string,
  usingLocalAmount: boolean,
  tokenAddress: string,
  inputTokenAmount?: BigNumber
) {
  const parsedAmount = parseInputAmount(inputAmount, decimalSeparator)
  const localToToken = useLocalToTokenAmount(parsedAmount, tokenAddress)
  const tokenToLocal = useTokenToLocalAmount(parsedAmount, tokenAddress)

  const localAmountRaw = usingLocalAmount ? parsedAmount : tokenToLocal
  // when using the local amount, the "inputAmount" value received here was
  // already converted once from the token value. if we calculate the token
  // value by converting again from local to token, we introduce rounding
  // precision errors. most of the time this is fine but when pressing the "max"
  // button and using the max token value this becomes a problem because the
  // precision error introduced may result in a higher token value than
  // original, preventing the user from sending the amount e.g. the max token
  // balance could be something like 15.00, after conversion to local currency
  // then back to token amount, it could be 15.000000001.
  const tokenAmountRaw = usingLocalAmount ? inputTokenAmount ?? localToToken : parsedAmount
  const localAmount = localAmountRaw && convertToMaxSupportedPrecision(localAmountRaw)
  const tokenAmount = convertToMaxSupportedPrecision(tokenAmountRaw!)

  const usdAmount = useAmountAsUsd(tokenAmount, tokenAddress)

  return {
    localAmount,
    tokenAmount,
    usdAmount: usdAmount && convertToMaxSupportedPrecision(usdAmount),
  }
}

function formatWithMaxDecimals(value: BigNumber | null, decimals: number) {
  if (!value || value.isNaN() || value.isZero()) {
    return ''
  }
  // The first toFormat limits the number of desired decimals and the second
  // removes trailing zeros.
  return parseInputAmount(
    value.toFormat(decimals, BigNumber.ROUND_DOWN),
    decimalSeparator
  ).toFormat()
}

function SendAmount(props: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [amount, setAmount] = useState('')
  const [rawAmount, setRawAmount] = useState('')
  const [usingLocalAmount, setUsingLocalAmount] = useState(true)
  const { isOutgoingPaymentRequest, recipient, origin, forceTokenAddress } = props.route.params
  const defaultToken = useSelector(defaultTokenToSendSelector)
  const inviteTokens = useSelector(stablecoinsSelector)
  const [transferTokenAddress, setTransferToken] = useState(forceTokenAddress ?? defaultToken)
  const [reviewButtonPressed, setReviewButtonPressed] = useState(false)
  const tokenInfo = useTokenInfo(transferTokenAddress)!
  const tokenHasUsdPrice = !!tokenInfo?.usdPrice
  const showInputInLocalAmount = usingLocalAmount && tokenHasUsdPrice

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const recipientVerificationStatus = useRecipientVerificationStatus(recipient)
  const feeType =
    recipientVerificationStatus === RecipientVerificationStatus.VERIFIED
      ? FeeType.SEND
      : FeeType.INVITE
  const shouldFetchNewFee =
    recipientVerificationStatus !== RecipientVerificationStatus.UNKNOWN && !isOutgoingPaymentRequest
  const maxBalance = useMaxSendAmount(transferTokenAddress, feeType, shouldFetchNewFee)
  const maxInLocalCurrency = useTokenToLocalAmount(maxBalance, transferTokenAddress)
  const maxAmountValue = showInputInLocalAmount ? maxInLocalCurrency : maxBalance
  const isUsingMaxAmount = rawAmount === maxAmountValue?.toFixed()

  const { tokenAmount, localAmount, usdAmount } = useInputAmounts(
    rawAmount,
    showInputInLocalAmount,
    transferTokenAddress,
    isUsingMaxAmount ? maxBalance : undefined
  )

  const onPressMax = () => {
    setAmount(
      formatWithMaxDecimals(
        maxAmountValue,
        showInputInLocalAmount ? LOCAL_CURRENCY_MAX_DECIMALS : TOKEN_MAX_DECIMALS
      )
    )
    setRawAmount(maxAmountValue?.toFixed() ?? '')
    ValoraAnalytics.track(SendEvents.max_pressed, { tokenAddress: transferTokenAddress })
  }
  const onSwapInput = () => {
    onAmountChange('')
    setUsingLocalAmount(!usingLocalAmount)
    ValoraAnalytics.track(SendEvents.swap_input_pressed, {
      tokenAddress: transferTokenAddress,
      swapToLocalAmount: !usingLocalAmount,
    })
  }

  useEffect(() => {
    dispatch(fetchTokenBalances({ showLoading: true }))
  }, [])

  useEffect(() => {
    onAmountChange('')
  }, [transferTokenAddress])

  const { onSend, onRequest } = useTransactionCallbacks({
    recipient,
    localAmount,
    tokenAmount,
    usdAmount,
    inputIsInLocalCurrency: showInputInLocalAmount,
    transferTokenAddress,
    origin,
    isFromScan: !!props.route.params?.isFromScan,
  })

  const maxEscrowInLocalAmount =
    useCurrencyToLocalAmount(MAX_ESCROW_VALUE, Currency.Dollar) ?? new BigNumber(0) // TODO: Improve error handling

  useEffect(() => {
    if (
      // It's an invite and we're not sending a core stablecoin.
      recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED &&
      !inviteTokens.map((token) => token.address).includes(transferTokenAddress)
    ) {
      setTransferToken(inviteTokens[0].address)
      onAmountChange('')
      return
    }

    if (reviewButtonPressed) {
      if (recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN) {
        // Wait until the recipient status is fetched.
        return
      } else if (
        recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED &&
        localAmount?.isGreaterThan(maxEscrowInLocalAmount)
      ) {
        dispatch(
          showError(ErrorMessages.MAX_ESCROW_TRANSFER_EXCEEDED, ALERT_BANNER_DURATION, {
            maxAmount: maxEscrowInLocalAmount?.toFixed(2),
            symbol: localCurrencySymbol,
          })
        )
      } else {
        isOutgoingPaymentRequest ? onRequest() : onSend()
      }
      setReviewButtonPressed(false)
    }
  }, [reviewButtonPressed, recipientVerificationStatus])

  const onReviewButtonPressed = () => setReviewButtonPressed(true)

  const isAmountValid = localAmount?.isGreaterThanOrEqualTo(STABLE_TRANSACTION_MIN_AMOUNT) ?? true

  const onAmountChange = (updatedAmount: string) => {
    setAmount(updatedAmount)
    setRawAmount(updatedAmount)
  }

  return (
    <SafeAreaView style={styles.container}>
      <SendAmountHeader
        tokenAddress={transferTokenAddress}
        isOutgoingPaymentRequest={!!props.route.params?.isOutgoingPaymentRequest}
        isInvite={recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED}
        onChangeToken={setTransferToken}
        disallowCurrencyChange={Boolean(forceTokenAddress)}
      />
      <DisconnectBanner />
      <View style={styles.contentContainer}>
        <SendAmountValue
          isOutgoingPaymentRequest={!!props.route.params?.isOutgoingPaymentRequest}
          inputAmount={amount}
          tokenAmount={tokenAmount}
          usingLocalAmount={showInputInLocalAmount}
          tokenAddress={transferTokenAddress}
          onPressMax={onPressMax}
          onSwapInput={onSwapInput}
          tokenHasUsdPrice={tokenHasUsdPrice}
        />
        <AmountKeypad
          amount={amount}
          maxDecimals={showInputInLocalAmount ? NUMBER_INPUT_MAX_DECIMALS : TOKEN_MAX_DECIMALS}
          onAmountChange={onAmountChange}
        />
      </View>
      <Button
        style={styles.nextBtn}
        size={BtnSizes.FULL}
        text={t('review')}
        showLoading={reviewButtonPressed}
        type={BtnTypes.PRIMARY}
        onPress={onReviewButtonPressed}
        disabled={!isAmountValid || reviewButtonPressed}
        testID="Review"
      />
    </SafeAreaView>
  )
}

SendAmount.navigationOptions = noHeader

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
  nextBtn: {
    padding: variables.contentPadding,
  },
})

export default SendAmount
