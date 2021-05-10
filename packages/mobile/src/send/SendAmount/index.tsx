import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import variables from '@celo/react-components/styles/variables'
import { parseInputAmount } from '@celo/utils/lib/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import AmountPadInput from 'src/components/AmountPadInput'
import { ALERT_BANNER_DURATION, DOLLAR_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { Namespaces } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import { RecipientVerificationStatus } from 'src/identity/types'
import { useStableCurrencyAmountInLocal } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useRecipientVerificationStatus } from 'src/recipients/hooks'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import SendAmountHeader from 'src/send/SendAmount/SendAmountHeader'
import SendAmountValue from 'src/send/SendAmount/SendAmountValue'
import useTransactionCallbacks from 'src/send/SendAmount/useTransactionCallbacks'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchStableBalances } from 'src/stableToken/actions'
import { defaultCurrencySelector } from 'src/stableToken/selectors'
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

type RouteProps = StackScreenProps<StackParamList, Screens.SendAmount>
type Props = RouteProps

const { decimalSeparator } = getNumberFormatSettings()

function SendAmount(props: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)

  const [amount, setAmount] = useState('')
  const defaultCurrency = useSelector(defaultCurrencySelector)
  const [transferCurrency, setTransferCurrency] = useState(defaultCurrency)
  const [reviewButtonPressed, setReviewButtonPressed] = useState(false)

  const { isOutgoingPaymentRequest, recipient, origin } = props.route.params

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
    useStableCurrencyAmountInLocal(MAX_ESCROW_VALUE, Currency.Dollar) ?? new BigNumber(0) // TODO: Improve error handling
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

  const isAmountValid = parsedLocalAmount.isGreaterThanOrEqualTo(DOLLAR_TRANSACTION_MIN_AMOUNT)

  return (
    <SafeAreaView style={styles.container}>
      <SendAmountHeader
        currency={transferCurrency}
        isOutgoingPaymentRequest={!!props.route.params?.isOutgoingPaymentRequest}
        onChangeCurrency={setTransferCurrency}
      />
      <DisconnectBanner />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <SendAmountValue amount={amount} />
        <AmountPadInput amount={amount} setAmount={setAmount} />
      </ScrollView>
      <Button
        style={styles.nextBtn}
        size={BtnSizes.FULL}
        text={t('global:review')}
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
