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
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import AmountKeypad from 'src/components/AmountKeypad'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import {
  ALERT_BANNER_DURATION,
  NUMBER_INPUT_MAX_DECIMALS,
  STABLE_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import { RecipientVerificationStatus } from 'src/identity/types'
import { useCurrencyToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useRecipientVerificationStatus } from 'src/recipients/hooks'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import SendAmountHeader from 'src/send/SendAmountLegacy/SendAmountHeader'
import SendAmountValue from 'src/send/SendAmountLegacy/SendAmountValue'
import useTransactionCallbacks from 'src/send/SendAmountLegacy/useTransactionCallbacks'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchStableBalances } from 'src/stableToken/actions'
import { defaultCurrencySelector } from 'src/stableToken/selectors'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'

const MAX_ESCROW_VALUE = new BigNumber(20)

export interface TransactionDataInput {
  recipient: Recipient
  amount: BigNumber
  currency: Currency
  type: TokenTransactionType
  reason?: string
  firebasePendingRequestUid?: string | null
}

type RouteProps = StackScreenProps<StackParamList, Screens.SendAmountLegacy>
type Props = RouteProps

const { decimalSeparator } = getNumberFormatSettings()

function SendAmountLegacy(props: Props) {
  const { t } = useTranslation()

  const [amount, setAmount] = useState('')
  const defaultCurrency = useSelector(defaultCurrencySelector)
  const { isOutgoingPaymentRequest, recipient, origin, forceCurrency } = props.route.params
  const [transferCurrency, setTransferCurrency] = useState(forceCurrency ?? defaultCurrency)
  const [reviewButtonPressed, setReviewButtonPressed] = useState(false)

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const recipientVerificationStatus = useRecipientVerificationStatus(recipient)

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchStableBalances())
    if (recipient.address) {
      return
    }

    if (!recipient.e164PhoneNumber) {
      throw Error('Recipient phone number is required if not sending via QR Code or address')
    }

    dispatch(fetchAddressesAndValidate(recipient.e164PhoneNumber))
  }, [])

  const parsedLocalAmount = parseInputAmount(amount, decimalSeparator)

  const { onSend, onRequest } = useTransactionCallbacks({
    recipient,
    localAmount: parsedLocalAmount,
    transferCurrency,
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
        parsedLocalAmount.isGreaterThan(maxEscrowInLocalAmount)
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

  const isAmountValid = parsedLocalAmount.isGreaterThanOrEqualTo(STABLE_TRANSACTION_MIN_AMOUNT)

  return (
    <SafeAreaView style={styles.container}>
      <SendAmountHeader
        currency={transferCurrency}
        isOutgoingPaymentRequest={!!props.route.params?.isOutgoingPaymentRequest}
        onChangeCurrency={setTransferCurrency}
        disallowCurrencyChange={Boolean(forceCurrency)}
      />
      <DisconnectBanner />
      <View style={styles.contentContainer}>
        <SendAmountValue amount={amount} />
        <AmountKeypad
          amount={amount}
          maxDecimals={NUMBER_INPUT_MAX_DECIMALS}
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

SendAmountLegacy.navigationOptions = noHeader

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

export default SendAmountLegacy
