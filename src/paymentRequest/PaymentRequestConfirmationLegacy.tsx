import { firebase } from '@react-native-firebase/database'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
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
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import ReviewFrame from 'src/components/ReviewFrame'
import TotalLineItem from 'src/components/TotalLineItem'
import {
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { writePaymentRequest } from 'src/paymentRequest/actions'
import { PaymentRequestStatus } from 'src/paymentRequest/types'
import { getDisplayName } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { getConfirmationInput } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

// @ts-ignore
const TAG = 'paymentRequest/confirmation'

type Props = StackScreenProps<StackParamList, Screens.PaymentRequestConfirmationLegacy>

export const paymentConfirmationScreenNavOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton eventName={RequestEvents.request_confirm_back} />,
})

function PaymentRequestConfirmation({ route }: Props) {
  const [comment, setComment] = useState('')
  const { transactionData, addressJustValidated } = route.params
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const walletAddress = useSelector(walletAddressSelector)
  const requesterE164Number = useSelector(e164NumberSelector)

  const confirmationInput = getConfirmationInput(
    transactionData,
    e164NumberToAddress,
    secureSendPhoneNumberMapping
  )

  const { t } = useTranslation()

  useEffect(() => {
    if (addressJustValidated) {
      Logger.showMessage(t('addressConfirmed'))
    }
  }, [])

  const dispatch = useDispatch()

  const onBlur = () => {
    const trimmedComment = comment.trim()
    setComment(trimmedComment)
  }

  const onConfirm = async () => {
    const { amount, recipient, recipientAddress: requesteeAddress } = confirmationInput

    if (!recipient) {
      throw new Error("Can't request without valid recipient")
    }

    if (!walletAddress) {
      throw new Error("Can't request without a valid account")
    }

    if (!requesteeAddress) {
      throw new Error('Error passing through the requestee address')
    }

    const paymentInfo = {
      amount: amount.toString(),
      comment: comment || undefined,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      requesterAddress: walletAddress,
      requesterE164Number: requesterE164Number ?? undefined,
      requesteeAddress: requesteeAddress.toLowerCase(),
      status: PaymentRequestStatus.REQUESTED,
      notified: false,
    }

    ValoraAnalytics.track(RequestEvents.request_confirm_request, { requesteeAddress })
    dispatch(writePaymentRequest(paymentInfo))
    Logger.showMessage(t('requestSent'))
  }

  const amount = {
    value: confirmationInput.amount,
    currencyCode: confirmationInput.currency,
  }

  const renderFooter = () => {
    return (
      <View style={styles.feeContainer}>
        <TotalLineItem amount={amount} showExchangeRate={false} />
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
            <ContactCircle recipient={confirmationInput.recipient} />
            <View style={styles.recipientInfoContainer}>
              <Text style={styles.headerText}>{t('requesting')}</Text>
              <Text style={styles.displayName}>
                {getDisplayName(confirmationInput.recipient, t)}
              </Text>
            </View>
          </View>
          <CurrencyDisplay type={DisplayType.Default} style={styles.amount} amount={amount} />
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
