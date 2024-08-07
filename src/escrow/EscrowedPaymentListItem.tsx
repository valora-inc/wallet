import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import ContactCircle from 'src/components/ContactCircle'
import RequestMessagingCard from 'src/components/RequestMessagingCard'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import { EscrowedPayment } from 'src/escrow/actions'
import { useEscrowPaymentRecipient } from 'src/escrow/utils'
import { NotificationBannerCTATypes, NotificationType } from 'src/home/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useTokenInfoByAddress } from 'src/tokens/hooks'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface Props {
  payment: EscrowedPayment
  index?: number
}

const TAG = 'EscrowedPaymentListItem'

function EscrowedPaymentListItem({ payment, index }: Props) {
  const { t } = useTranslation()
  const recipient = useEscrowPaymentRecipient(payment)
  const tokenInfo = useTokenInfoByAddress(payment.tokenAddress)

  const onRemind = async () => {
    AppAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationType.escrow_tx_pending,
      notificationId: `${NotificationType.escrow_tx_pending}/${payment.paymentID}`,
      selectedAction: NotificationBannerCTATypes.remind,
      notificationPositionInList: index,
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
    AppAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationType.escrow_tx_pending,
      notificationId: `${NotificationType.escrow_tx_pending}/${payment.paymentID}`,
      selectedAction: NotificationBannerCTATypes.reclaim,
      notificationPositionInList: index,
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
    <RequestMessagingCard
      title={t('escrowPaymentNotificationTitle', { mobile: nameToShow })}
      amount={
        <LegacyTokenDisplay
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
  )
}

export default EscrowedPaymentListItem
