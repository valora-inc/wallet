import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ContactCircle from 'src/components/ContactCircle'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import RequestMessagingCard from 'src/components/RequestMessagingCard'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { withTranslation } from 'src/i18n'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/paymentRequest/actions'
import { getDisplayName, Recipient } from 'src/recipients/recipient'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

interface OwnProps {
  id: string
  requestee: Recipient
  amount: string
  comment?: string
  cancelPaymentRequest: typeof cancelPaymentRequest
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
}

type Props = OwnProps & WithTranslation

export class OutgoingPaymentRequestListItem extends React.Component<Props> {
  onRemind = () => {
    const { id, t } = this.props
    this.props.updatePaymentRequestNotified(id, false)
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.outgoing_tx_request,
      selectedAction: NotificationBannerCTATypes.remind,
    })
    Logger.showMessage(t('reminderSent'))
  }

  onCancel = () => {
    const { id } = this.props
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.outgoing_tx_request,
      selectedAction: NotificationBannerCTATypes.decline,
    })
    this.props.cancelPaymentRequest(id)
  }

  getCTA = () => {
    return [
      {
        text: this.props.t('remind'),
        onPress: this.onRemind,
      },
      {
        text: this.props.t('cancel'),
        onPress: this.onCancel,
      },
    ]
  }

  render() {
    const { requestee, id, comment, t } = this.props
    const amount = {
      value: this.props.amount,
      currencyCode: Currency.Dollar,
    }

    return (
      <View style={styles.container}>
        <RequestMessagingCard
          testID={`OutgoingPaymentRequestNotification/${id}`}
          title={t('outgoingPaymentRequestNotificationTitle', {
            name: getDisplayName(requestee, t),
          })}
          amount={<CurrencyDisplay amount={amount} />}
          details={comment}
          icon={<ContactCircle recipient={requestee} />}
          callToActions={this.getCTA()}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
})

export default withTranslation<Props>()(OutgoingPaymentRequestListItem)
