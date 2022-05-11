import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ContactCircle from 'src/components/ContactCircle'
import RequestMessagingCard from 'src/components/RequestMessagingCard'
import TokenDisplay from 'src/components/TokenDisplay'
import { EscrowedPayment } from 'src/escrow/actions'
import { useEscrowPaymentRecipient } from 'src/escrow/utils'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useTokenInfo } from 'src/tokens/hooks'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface Props {
  payment: EscrowedPayment
}

const TAG = 'EscrowedPaymentListItem'

function EscrowedPaymentListItem({ payment }: Props) {
  const { t } = useTranslation()
  const recipient = useEscrowPaymentRecipient(payment)
  const tokenInfo = useTokenInfo(payment.tokenAddress)

  const onRemind = async () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_pending,
      selectedAction: NotificationBannerCTATypes.remind,
    })

    try {
      await Share.share({
        message: t('escrowedPaymentReminderSmsNoData', {
          currency: tokenInfo?.symbol,
        }),
      })
    } catch (error) {
      Logger.error(TAG, 'Error sending reminder', error)
    }
  }

  const onReclaimPayment = () => {
    const reclaimPaymentInput = payment
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_pending,
      selectedAction: NotificationBannerCTATypes.reclaim,
    })
    navigate(Screens.ReclaimPaymentConfirmationScreen, { reclaimPaymentInput })
  }

  const getCTA = () => {
    const ctas = []
    if (recipient.e164PhoneNumber) {
      ctas.push({
        text: t('remind'),
        onPress: onRemind,
      })
    }
    ctas.push({
      text: t('reclaim'),
      onPress: onReclaimPayment,
    })
    return ctas
  }

  const nameToShow = recipient.name ?? t('unknown')

  return (
    <View style={styles.container}>
      <RequestMessagingCard
        title={t('escrowPaymentNotificationTitle', { mobile: nameToShow })}
        amount={
          <TokenDisplay
            amount={divideByWei(payment.amount)}
            tokenAddress={payment.tokenAddress}
            testID="EscrowedPaymentListItem/amount"
          />
        }
        details={payment.message}
        icon={<ContactCircle recipient={recipient} />}
        callToActions={getCTA()}
        testID={'EscrowedPaymentListItem'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
})

export default EscrowedPaymentListItem
