import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import variables from '@celo/react-components/styles/variables'
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
import { ErrorMessages } from 'src/app/ErrorMessages'
import AmountKeypad from 'src/components/AmountKeypad'
import {
  ALERT_BANNER_DURATION,
  NUMBER_INPUT_MAX_DECIMALS,
  STABLE_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import { fetchAddressesAndValidate } from 'src/identity/actions'
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
import {
  useAmountAsUsd,
  useLocalToTokenAmount,
  useTokenInfo,
  useTokenToLocalAmount,
} from 'src/tokens/hooks'
import { fetchTokenBalances } from 'src/tokens/reducer'
import { defaultTokenSelector } from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'

const MAX_ESCROW_VALUE = new BigNumber(20)

export interface TransactionDataInput {
  recipient: Recipient
  inputAmount: BigNumber
  amountIsInLocalCurrency: boolean
  tokenAddress: string
}

type RouteProps = StackScreenProps<StackParamList, Screens.SendAmount>
type Props = RouteProps

const { decimalSeparator } = getNumberFormatSettings()

export function useInputAmounts(
  inputAmount: string,
  usingLocalAmount: boolean,
  tokenAddress: string
) {
  const parsedAmount = parseInputAmount(inputAmount, decimalSeparator)
  const localToToken = useLocalToTokenAmount(parsedAmount, tokenAddress)!
  const tokenToLocal = useTokenToLocalAmount(parsedAmount, tokenAddress)!

  const localAmount = convertToMaxSupportedPrecision(usingLocalAmount ? parsedAmount : tokenToLocal)
  const tokenAmount = convertToMaxSupportedPrecision(usingLocalAmount ? localToToken : parsedAmount)

  const usdAmount = useAmountAsUsd(tokenAmount, tokenAddress)

  return {
    localAmount,
    tokenAmount,
    usdAmount: convertToMaxSupportedPrecision(usdAmount!),
  }
}

function SendAmount(props: Props) {
  const { t } = useTranslation()

  const [amount, setAmount] = useState('')
  const [usingLocalAmount, setUsingLocalAmount] = useState(true)
  const { isOutgoingPaymentRequest, recipient, origin, forceTokenAddress } = props.route.params
  const defaultToken = useSelector(defaultTokenSelector)
  const [transferTokenAddress, setTransferToken] = useState(forceTokenAddress ?? defaultToken)
  const [reviewButtonPressed, setReviewButtonPressed] = useState(false)
  const tokenInfo = useTokenInfo(transferTokenAddress)!

  const { tokenAmount, localAmount, usdAmount } = useInputAmounts(
    amount,
    usingLocalAmount,
    transferTokenAddress
  )
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const recipientVerificationStatus = useRecipientVerificationStatus(recipient)

  const maxInLocalCurrency =
    useTokenToLocalAmount(tokenInfo.balance, transferTokenAddress)?.toString() ?? ''
  const onPressMax = () => {
    // TODO: Take into account fee amount if only one fee token has a balance.
    setAmount(usingLocalAmount ? maxInLocalCurrency : tokenInfo.balance.toString())
  }
  const onPressClear = () => {
    setAmount('')
  }
  const onSwapInput = () => setUsingLocalAmount(!usingLocalAmount)

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchTokenBalances())
    if (recipient.address) {
      return
    }

    if (!recipient.e164PhoneNumber) {
      throw Error('Recipient phone number is required if not sending via QR Code or address')
    }

    dispatch(fetchAddressesAndValidate(recipient.e164PhoneNumber))
  }, [])

  const { onSend, onRequest } = useTransactionCallbacks({
    recipient,
    localAmount,
    tokenAmount,
    usdAmount,
    inputIsInLocalCurrency: usingLocalAmount,
    transferTokenAddress,
    origin,
    isFromScan: !!props.route.params?.isFromScan,
  })

  const maxEscrowInLocalAmount =
    useCurrencyToLocalAmount(MAX_ESCROW_VALUE, Currency.Dollar) ?? new BigNumber(0) // TODO: Improve error handling
  useEffect(() => {
    if (reviewButtonPressed) {
      if (recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN) {
        // Wait until the recipient status is fetched.
        return
      } else if (
        recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED &&
        localAmount.isGreaterThan(maxEscrowInLocalAmount)
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

  const isAmountValid = localAmount.isGreaterThanOrEqualTo(STABLE_TRANSACTION_MIN_AMOUNT)

  return (
    <SafeAreaView style={styles.container}>
      <SendAmountHeader
        tokenAddress={transferTokenAddress}
        isOutgoingPaymentRequest={!!props.route.params?.isOutgoingPaymentRequest}
        onChangeToken={setTransferToken}
        disallowCurrencyChange={Boolean(forceTokenAddress)}
      />
      <DisconnectBanner />
      <View style={styles.contentContainer}>
        <SendAmountValue
          inputAmount={amount}
          tokenAmount={tokenAmount}
          usingLocalAmount={usingLocalAmount}
          tokenAddress={transferTokenAddress}
          isOutgoingPaymentRequest={!!props.route.params?.isOutgoingPaymentRequest}
          onPressMax={onPressMax}
          onSwapInput={onSwapInput}
          onPressClear={onPressClear}
        />
        <AmountKeypad
          amount={amount}
          maxDecimals={usingLocalAmount ? NUMBER_INPUT_MAX_DECIMALS : tokenInfo?.decimals ?? 0}
          onAmountChange={setAmount}
        />
      </View>
      <Button
        style={styles.nextBtn}
        size={BtnSizes.FULL}
        text={t('review')}
        showLoading={
          recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN && reviewButtonPressed
        }
        type={BtnTypes.SECONDARY}
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
