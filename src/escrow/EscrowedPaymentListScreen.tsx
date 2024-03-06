import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import i18n from 'src/i18n'
import {
  NotificationList,
  titleWithBalanceNavigationOptions,
} from 'src/notifications/NotificationList'
import { useSelector } from 'src/redux/hooks'
import { Spacing } from 'src/styles/styles'

export const listItemRenderer = (payment: EscrowedPayment, key: number | undefined = undefined) => {
  return (
    <View key={key} style={styles.listItem}>
      <EscrowedPaymentListItem payment={payment} />
    </View>
  )
}

export default function EscrowedPaymentListScreen() {
  const sentEscrowedPayments = useSelector(getReclaimableEscrowPayments)
  return <NotificationList items={sentEscrowedPayments} listItemRenderer={listItemRenderer} />
}

EscrowedPaymentListScreen.navigationOptions = titleWithBalanceNavigationOptions(
  i18n.t('escrowedPaymentReminder')
)

const styles = StyleSheet.create({
  listItem: {
    marginBottom: Spacing.Regular16,
  },
})
