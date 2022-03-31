import { firebase } from '@react-native-firebase/database'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { RequestEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import CommentTextInput from 'src/components/CommentTextInput'
import ContactCircle from 'src/components/ContactCircle'
import ReviewFrame from 'src/components/ReviewFrame'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { writePaymentRequest } from 'src/paymentRequest/actions'
import { PaymentRequestStatus } from 'src/paymentRequest/types'
import { getDisplayName } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { useInputAmounts } from 'src/send/SendAmount'
import { useRecipientToSendTo } from 'src/send/SendConfirmation'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

// @ts-ignore
const TAG = 'paymentRequest/confirmation'

type Props = StackScreenProps<StackParamList, Screens.PaymentRequestConfirmation>

export const paymentConfirmationScreenNavOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton eventName={RequestEvents.request_confirm_back} />,
})

function PaymentRequestConfirmation({ route }: Props) {
  const [comment, setComment] = useState('')
  const { transactionData } = route.params
  const requesterAddress = useSelector(walletAddressSelector)
  const requesterE164Number = useSelector(e164NumberSelector)

  const recipient = useRecipientToSendTo(transactionData.recipient)
  const { tokenAmount, usdAmount } = useInputAmounts(
    transactionData.inputAmount.toString(),
    transactionData.amountIsInLocalCurrency,
    transactionData.tokenAddress
  )

  const { t } = useTranslation()

  const dispatch = useDispatch()

  const onBlur = () => {
    const trimmedComment = comment.trim()
    setComment(trimmedComment)
  }

  const onConfirm = async () => {
    if (!recipient) {
      throw new Error("Can't request without valid recipient")
    }

    if (!requesterAddress) {
      throw new Error("Can't request without a valid account")
    }

    if (!recipient.address) {
      throw new Error('Error passing through the requestee address')
    }

    if (!usdAmount) {
      // Should not happen
      throw new Error('Trying to request from a token without a usd price')
    }

    const paymentInfo = {
      amount: usdAmount.toString(),
      comment: comment || undefined,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      requesterAddress: requesterAddress,
      requesterE164Number: requesterE164Number ?? undefined,
      requesteeAddress: recipient.address.toLowerCase(),
      status: PaymentRequestStatus.REQUESTED,
      notified: false,
    }

    ValoraAnalytics.track(RequestEvents.request_confirm_request, {
      requesteeAddress: paymentInfo.requesteeAddress,
    })
    dispatch(writePaymentRequest(paymentInfo))
    Logger.showMessage(t('requestSent'))
  }

  const renderFooter = () => {
    return (
      <View style={styles.feeContainer}>
        <TokenTotalLineItem tokenAmount={tokenAmount} tokenAddress={transactionData.tokenAddress} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DisconnectBanner />
      <ReviewFrame
        FooterComponent={renderFooter}
        confirmButton={{
          action: onConfirm,
          text: t('request'),
          disabled: false,
        }}
      >
        <View style={styles.transferContainer}>
          <View style={styles.headerContainer}>
            <ContactCircle recipient={recipient} />
            <View style={styles.recipientInfoContainer}>
              <Text style={styles.headerText}>{t('requesting')}</Text>
              <Text style={styles.displayName}>{getDisplayName(recipient, t)}</Text>
            </View>
          </View>
          <TokenDisplay
            style={styles.amount}
            amount={tokenAmount}
            tokenAddress={transactionData.tokenAddress}
          />
          <CommentTextInput
            testID={'request'}
            onCommentChange={setComment}
            comment={comment}
            onBlur={onBlur}
          />
        </View>
      </ReviewFrame>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  feeContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  transferContainer: {
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipientInfoContainer: {
    paddingLeft: 8,
  },
  headerText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
  displayName: {
    ...fontStyles.regular500,
  },
  amount: {
    paddingVertical: 8,
    ...fontStyles.largeNumber,
  },
})

export default PaymentRequestConfirmation
