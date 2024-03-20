import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import i18n from 'src/i18n'
import { HeaderTitleWithBalance, headerWithBackButton } from 'src/navigator/Headers'
import { NotificationList } from 'src/notifications/NotificationList'
import { useSelector } from 'src/redux/hooks'
import { Spacing } from 'src/styles/styles'
import { Currency } from 'src/utils/currencies'

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

EscrowedPaymentListScreen.navigationOptions = () => ({
  ...headerWithBackButton,
  headerTitle: () => (
    <HeaderTitleWithBalance title={i18n.t('escrowedPaymentReminder')} token={Currency.Dollar} />
  ),
})

const styles = StyleSheet.create({
  listItem: {
    marginBottom: Spacing.Regular16,
  },
})
