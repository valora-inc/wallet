import RequestMessagingCard from '@celo/react-components/components/RequestMessagingCard'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import ContactCircle from 'src/components/ContactCircle'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { EscrowedPayment } from 'src/escrow/actions'
import { useEscrowPaymentRecipientName } from 'src/escrow/utils'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { Namespaces } from 'src/i18n'
import { InviteDetails } from 'src/invite/actions'
import { sendSms } from 'src/invite/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

interface Props {
  payment: EscrowedPayment
  invitees: InviteDetails[]
}

const TAG = 'EscrowedPaymentListItem'

const testID = 'EscrowedPaymentListItem'

function EscrowedPaymentListItem({ payment, invitees }: Props) {
  const { t } = useTranslation(Namespaces.inviteFlow11)
  const displayName = useEscrowPaymentRecipientName(payment)

  const onRemind = async () => {
    const recipientPhoneNumber = payment.recipientPhone
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_pending,
      selectedAction: NotificationBannerCTATypes.remind,
    })

    try {
      const inviteDetails = invitees.find(
        (inviteeObj) => recipientPhoneNumber === inviteeObj.e164Number
      )

      let message
      if (!inviteDetails) {
        message = t('walletFlow5:escrowedPaymentReminderSmsNoData')
      } else {
        const { inviteCode, inviteLink } = inviteDetails
        message = t('walletFlow5:escrowedPaymentReminderSms', {
          code: inviteCode,
          link: inviteLink,
        })
      }

      await sendSms(recipientPhoneNumber, message)
    } catch (error) {
      // TODO: use the showError saga instead of the Logger.showError, which is a hacky temp thing we used for a while that doesn't actually work on iOS
      Logger.showError(ErrorMessages.SMS_ERROR)
      Logger.error(TAG, `Error sending SMS to ${recipientPhoneNumber}`, error)
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
    if (payment.recipientPhone) {
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

  const nameToShow = displayName ?? t('global:unknown')
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
        icon={
          <ContactCircle
            name={nameToShow}
            // TODO: Add thumbnailPath={}
          />
        }
        callToActions={getCTA()}
        testID={testID}
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
