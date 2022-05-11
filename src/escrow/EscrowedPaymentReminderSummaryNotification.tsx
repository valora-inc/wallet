import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'
import { listItemRenderer } from 'src/escrow/EscrowedPaymentListScreen'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { notificationInvite } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SummaryNotification from 'src/notifications/SummaryNotification'

interface Props {
  payments: EscrowedPayment[]
}

function EscrowedPaymentReminderSummaryNotification({ payments }: Props) {
  const { t } = useTranslation()

  const onReview = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_summary,
      selectedAction: NotificationBannerCTATypes.review,
    })
    navigate(Screens.EscrowedPaymentListScreen)
  }

  const itemRenderer = (item: EscrowedPayment) => {
    return <EscrowedPaymentLineItem payment={item} key={item.paymentID} />
  }

  if (payments.length === 1) {
    return listItemRenderer(payments[0])
  }

  return (
    <SummaryNotification<EscrowedPayment>
      items={payments}
      title={t('escrowedPaymentReminderSummaryTitle', { count: payments.length })}
      detailsI18nKey="escrowedPaymentReminderSummaryDetails"
      icon={<Image source={notificationInvite} resizeMode="contain" />}
      onReview={onReview}
      itemRenderer={itemRenderer}
    />
  )
}

export default EscrowedPaymentReminderSummaryNotification
