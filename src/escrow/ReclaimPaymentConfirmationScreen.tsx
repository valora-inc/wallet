import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showError } from 'src/alert/actions'
import { EscrowEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import ReviewFrame from 'src/components/ReviewFrame'
import ReviewHeader from 'src/components/ReviewHeader'
import ReclaimPaymentConfirmationCard from 'src/escrow/ReclaimPaymentConfirmationCard'
import { reclaimEscrowPayment, reclaimEscrowPaymentCancel } from 'src/escrow/actions'
import { FeeType, estimateFee } from 'src/fees/reducer'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RecipientType } from 'src/recipients/recipient'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import Logger from 'src/utils/Logger'
import { ONE_HOUR_IN_MILLIS } from 'src/utils/time'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'escrow/ReclaimPaymentConfirmationScreen'

type Props = NativeStackScreenProps<StackParamList, Screens.ReclaimPaymentConfirmationScreen>

export default function ReclaimPaymentConfirmationScreen({ navigation, route }: Props) {
  const { t } = useTranslation()

  const { amount, tokenAddress } = route.params.reclaimPaymentInput

  const isReclaiming = useSelector((state) => state.escrow.isReclaiming)
  const account = useSelector(currentAccountSelector)
  const appConnected = useSelector(isAppConnected)

  const dispatch = useDispatch()

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (isReclaiming) {
        dispatch(reclaimEscrowPaymentCancel())
        ValoraAnalytics.track(EscrowEvents.escrow_reclaim_cancel)
      }
    })

    return unsubscribe
  }, [])

  const getReclaimPaymentInput = () => {
    const reclaimPaymentInput = route.params.reclaimPaymentInput
    if (!reclaimPaymentInput) {
      throw new Error('Reclaim payment input missing')
    }
    return reclaimPaymentInput
  }

  const onConfirm = async () => {
    const escrowedPayment = getReclaimPaymentInput()
    ValoraAnalytics.track(EscrowEvents.escrow_reclaim_confirm)
    const address = account
    if (!address) {
      throw new Error("Can't reclaim funds without a valid account")
    }

    try {
      dispatch(reclaimEscrowPayment(escrowedPayment.paymentID))
    } catch (error) {
      Logger.error(TAG, 'Reclaiming escrowed payment failed, show error message', error)
      dispatch(showError(ErrorMessages.RECLAIMING_ESCROWED_PAYMENT_FAILED))
      return
    }
  }

  const onCancel = () => navigateBack()

  const renderHeader = () => {
    const title = t('reclaimPayment')
    return <ReviewHeader title={title} />
  }

  const renderFooter = () => {
    return isReclaiming ? <ActivityIndicator size="large" color={colors.primary} /> : null
  }

  const payment = getReclaimPaymentInput()

  const feeEstimates = useSelector(feeEstimatesSelector)
  const feeEstimate = feeEstimates[tokenAddress]?.[FeeType.RECLAIM_ESCROW]

  useEffect(() => {
    if (
      !feeEstimate ||
      feeEstimate.error ||
      feeEstimate.lastUpdated < Date.now() - ONE_HOUR_IN_MILLIS
    ) {
      dispatch(
        estimateFee({ feeType: FeeType.RECLAIM_ESCROW, tokenAddress, paymentID: payment.paymentID })
      )
    }
  }, [tokenAddress])

  return (
    <SafeAreaView style={styles.container}>
      <DisconnectBanner />
      <ReviewFrame
        HeaderComponent={renderHeader}
        FooterComponent={renderFooter}
        confirmButton={{
          action: onConfirm,
          text: t('confirm'),
          disabled: isReclaiming || !appConnected || feeEstimate?.loading || !!feeEstimate?.error,
        }}
        modifyButton={{ action: onCancel, text: t('cancel'), disabled: isReclaiming }}
      >
        <ReclaimPaymentConfirmationCard
          recipientPhone={payment.recipientPhone}
          recipientContact={
            {
              e164PhoneNumber: payment.recipientPhone,
              recipientType: RecipientType.PhoneNumber,
            } /* TODO get recipient contact details from recipient cache*/
          }
          amount={new BigNumber(amount)}
          tokenAddress={tokenAddress}
        />
      </ReviewFrame>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
})
