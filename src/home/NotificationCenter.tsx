import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SimpleMessagingCard from 'src/components/SimpleMessagingCard'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import type { Notification } from 'src/home/NotificationBox'
import {
  INCOMING_PAYMENT_REQUESTS_PRIORITY,
  INVITES_PRIORITY,
  OUTGOING_PAYMENT_REQUESTS_PRIORITY,
  useSimpleActions,
} from 'src/home/NotificationBox'
import ThumbsUpIllustration from 'src/icons/ThumbsUpIllustration'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import OutgoingPaymentRequestListItem from 'src/paymentRequest/OutgoingPaymentRequestListItem'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/paymentRequest/actions'
import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type NotificationsProps = NativeStackScreenProps<StackParamList, Screens.NotificationCenter>

export function useNotifications() {
  const notifications: Notification[] = []

  // Pending outgoing invites in escrow
  const reclaimableEscrowPayments = useSelector(getReclaimableEscrowPayments)
  if (reclaimableEscrowPayments && reclaimableEscrowPayments.length) {
    for (const payment of reclaimableEscrowPayments) {
      const itemPriority = Number(`${INVITES_PRIORITY}.${payment.timestamp.toString()}`)

      notifications.push({
        element: <EscrowedPaymentListItem payment={payment} />,
        priority: !Number.isNaN(itemPriority) ? itemPriority : INVITES_PRIORITY,
        id: `reclaimInvite/${payment.paymentID}`,
      })
    }
  }

  // Incoming payment requests
  const incomingPaymentRequests = useSelector(getIncomingPaymentRequests)
  if (incomingPaymentRequests && incomingPaymentRequests.length) {
    for (const request of incomingPaymentRequests) {
      if (!request.uid) {
        continue
      }

      const itemPriority = Number(`${INCOMING_PAYMENT_REQUESTS_PRIORITY}.${request.createdAt ?? 0}`)

      notifications.push({
        element: <IncomingPaymentRequestListItem paymentRequest={request} />,
        priority: !Number.isNaN(itemPriority) ? itemPriority : INCOMING_PAYMENT_REQUESTS_PRIORITY,
        id: `incomingPaymentRequest/${request.uid}`,
      })
    }
  }

  // Outgoing payment requests
  const outgoingPaymentRequests = useSelector(getOutgoingPaymentRequests)
  if (outgoingPaymentRequests && outgoingPaymentRequests.length) {
    const recipientInfo = useSelector(recipientInfoSelector)

    for (const request of outgoingPaymentRequests) {
      if (!request.uid) {
        continue
      }

      const requestee = getRecipientFromAddress(request.requesteeAddress, recipientInfo)

      const itemPriority = Number(`${OUTGOING_PAYMENT_REQUESTS_PRIORITY}.${request.createdAt ?? 0}`)

      notifications.push({
        element: (
          <OutgoingPaymentRequestListItem
            id={request.uid}
            amount={request.amount}
            requestee={requestee}
            comment={request.comment}
            cancelPaymentRequest={cancelPaymentRequest}
            updatePaymentRequestNotified={updatePaymentRequestNotified}
          />
        ),
        priority: !Number.isNaN(itemPriority) ? itemPriority : OUTGOING_PAYMENT_REQUESTS_PRIORITY,
        id: `outgoingPaymentRequest/${request.uid}`,
      })
    }
  }

  const simpleActions = useSimpleActions()
  notifications.push(
    ...simpleActions.map((notification) => ({
      element: <SimpleMessagingCard testID={notification.id} {...notification} />,
      priority: notification.priority,
      id: notification.id,
    }))
  )

  return notifications.sort((n1, n2) => n2.priority - n1.priority)
}

export default function Notifications({ navigation }: NotificationsProps) {
  const safeAreaInsets = useSafeAreaInsets()

  const { t } = useTranslation()
  const title = t('notifications')

  const notifications = useNotifications()

  const scrollPosition = useSharedValue(0)

  const [headerYPosition, setHeaderYPosition] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)

  useScrollAwareHeader({
    navigation,
    title,
    scrollPosition,
    startFadeInPosition: headerYPosition,
    animationDistance: headerHeight,
  })

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollPosition.value = event.contentOffset.y
  })

  const handleMeasureHeaderHeight = (event: LayoutChangeEvent) => {
    setHeaderYPosition(event.nativeEvent.layout.y)
    setHeaderHeight(event.nativeEvent.layout.height)
  }

  const renderHeader = () => (
    <Text style={styles.title} onLayout={handleMeasureHeaderHeight}>
      {title}
    </Text>
  )

  const renderEmptyState = () => (
    <View testID="NotificationCenter/EmptyState" style={styles.emptyStateContainer}>
      <ThumbsUpIllustration />
      <Text style={styles.emptyStateLabel}>{t('noNotificationsPlaceholder')}</Text>
    </View>
  )

  const renderItemSeparator = () => <View style={styles.itemSeparator} />

  const renderItem = ({ item }: { item: Notification }) => {
    return (
      <View testID={`NotificationView/${item.id}`} key={item.id} style={styles.listItem}>
        {item.element}
      </View>
    )
  }

  const keyExtractor = (item: Notification) => item.id

  const contentContainerStyle = { paddingBottom: safeAreaInsets.bottom + Spacing.Regular16 }

  return (
    <Animated.FlatList
      style={styles.container}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyState}
      ItemSeparatorComponent={renderItemSeparator}
      data={notifications}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onScroll={handleScroll}
      contentContainerStyle={contentContainerStyle}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...fontStyles.large600,
    fontSize: 24,
    lineHeight: 32,
    color: colors.dark,
    margin: Spacing.Thick24,
    marginTop: Spacing.Smallest8,
  },
  listItem: {
    paddingHorizontal: Spacing.Thick24,
  },
  itemSeparator: {
    height: Spacing.Thick24,
  },
  emptyStateContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyStateLabel: {
    ...fontStyles.regular600,
    lineHeight: 24,
    marginTop: Spacing.Regular16,
  },
})
