import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ContactCircle from 'src/components/ContactCircle'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { EscrowedPayment } from 'src/escrow/actions'
import { useEscrowPaymentRecipient } from 'src/escrow/utils'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface Props {
  payment: EscrowedPayment
}

const TAG = 'EscrowedPaymentListItem'

function EscrowedPaymentListItem({ payment }: Props) {
  const { t } = useTranslation(Namespaces.inviteFlow11)
  const recipient = useEscrowPaymentRecipient(payment)

  const onRemind = async () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_pending,
      selectedAction: NotificationBannerCTATypes.remind,
    })

    try {
      await Share.share({ message: t('walletFlow5:escrowedPaymentReminderSmsNoData') })
    } catch (error) {
      Logger.error(TAG, `Error sending reminder to ${recipient.e164PhoneNumber}`, error)
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
        text: t('global:remind'),
        onPress: onRemind,
      })
    }
    ctas.push({
      text: t('global:reclaim'),
      onPress: onReclaimPayment,
    })
    return ctas
  }

  const nameToShow = recipient.name ?? t('global:unknown')
  const amount = {
    value: divideByWei(payment.amount),
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  return (
    <View style={styles.container}>
      <RequestMessagingCard
        title={t('escrowPaymentNotificationTitle', { mobile: nameToShow })}
        amount={<CurrencyDisplay amount={amount} />}
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
