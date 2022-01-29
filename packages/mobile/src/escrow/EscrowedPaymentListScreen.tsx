import * as React from 'react'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import i18n from 'src/i18n'
import {
  NotificationList,
  titleWithBalanceNavigationOptions,
} from 'src/notifications/NotificationList'
import useSelector from 'src/redux/useSelector'

export const listItemRenderer = (payment: EscrowedPayment, key: number | undefined = undefined) => {
  return <EscrowedPaymentListItem key={key} payment={payment} />
}

export default function EscrowedPaymentListScreen() {
  const sentEscrowedPayments = useSelector(getReclaimableEscrowPayments)
  return <NotificationList items={sentEscrowedPayments} listItemRenderer={listItemRenderer} />
}

EscrowedPaymentListScreen.navigationOptions = titleWithBalanceNavigationOptions(
  i18n.t('escrowedPaymentReminder')
)
