import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View, ViewToken } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SimpleMessagingCard from 'src/components/SimpleMessagingCard'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { reclaimInviteNotificationId } from 'src/escrow/utils'
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
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/paymentRequest/actions'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import OutgoingPaymentRequestListItem from 'src/paymentRequest/OutgoingPaymentRequestListItem'
import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import {
  incomingPaymentRequestNotificationId,
  outgoingPaymentRequestNotificationId,
} from 'src/paymentRequest/utils'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type NotificationPositions = Record<string, number>
type NotificationCenterProps = NativeStackScreenProps<StackParamList, Screens.NotificationCenter>
type NotificationsProps = {
  navigation: NotificationCenterProps['navigation']
  setNotificationPositions: React.Dispatch<React.SetStateAction<NotificationPositions>>
}

const NotificationCenterContext = createContext<{ notificationPositions?: NotificationPositions }>(
  {}
)

export function useNotificationCenterContext() {
  const context = useContext(NotificationCenterContext)
  return context
}

export function useNotifications() {
  const dispatch = useDispatch()
  const recipientInfo = useSelector(recipientInfoSelector)

  const notifications: Notification[] = []

  // Pending outgoing invites in escrow
  const reclaimableEscrowPayments = useSelector(getReclaimableEscrowPayments)
  if (reclaimableEscrowPayments && reclaimableEscrowPayments.length) {
    for (const payment of reclaimableEscrowPayments) {
      const itemPriority = Number(`${INVITES_PRIORITY}.${payment.timestamp.toString()}`)

      notifications.push({
        element: <EscrowedPaymentListItem payment={payment} />,
        priority: !Number.isNaN(itemPriority) ? itemPriority : INVITES_PRIORITY,
        id: reclaimInviteNotificationId(payment.paymentID),
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
        id: incomingPaymentRequestNotificationId(request.uid),
      })
    }
  }

  // Outgoing payment requests
  const handleCancelPaymentRequest = (id: string) => dispatch(cancelPaymentRequest(id))
  const handleUpdatePaymentRequestNotified = (id: string) =>
    dispatch(updatePaymentRequestNotified(id, false))

  const outgoingPaymentRequests = useSelector(getOutgoingPaymentRequests)
  if (outgoingPaymentRequests && outgoingPaymentRequests.length) {
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
            cancelPaymentRequest={handleCancelPaymentRequest}
            updatePaymentRequestNotified={handleUpdatePaymentRequestNotified}
          />
        ),
        priority: !Number.isNaN(itemPriority) ? itemPriority : OUTGOING_PAYMENT_REQUESTS_PRIORITY,
        id: outgoingPaymentRequestNotificationId(request.uid),
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

export default function NotificationCenter({ navigation }: NotificationCenterProps) {
  const [notificationPositions, setNotificationPositions] = useState<NotificationPositions>({})

  return (
    <NotificationCenterContext.Provider value={{ notificationPositions }}>
      <Notifications navigation={navigation} setNotificationPositions={setNotificationPositions} />
    </NotificationCenterContext.Provider>
  )
}

function Notifications({ navigation, setNotificationPositions }: NotificationsProps) {
  const safeAreaInsets = useSafeAreaInsets()

  const { t } = useTranslation()
  const title = t('notifications')

  const notifications = useNotifications()

  const seenNotifications = useRef(new Set())

  useEffect(() => {
    ValoraAnalytics.track(HomeEvents.notification_center_opened, {
      notificationsCount: notifications.length,
    })
  }, [])

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 100,
    minimumViewTime: 500,
  })

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

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach(({ item }, index) => {
        setNotificationPositions((prevNotificationPositions) => ({
          ...prevNotificationPositions,
          [item.id]: index,
        }))

        if (!seenNotifications.current.has(item.id)) {
          seenNotifications.current.add(item.id)

          ValoraAnalytics.track(HomeEvents.notification_impression, {
            notificationId: item.id,
            notificationPosition: index,
          })
        }
      })
    },
    []
  )

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
      testID="NotificationCenter"
      style={styles.container}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyState}
      ItemSeparatorComponent={renderItemSeparator}
      data={notifications}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onScroll={handleScroll}
      viewabilityConfig={viewabilityConfig.current}
      onViewableItemsChanged={handleViewableItemsChanged}
      contentContainerStyle={contentContainerStyle}
    />
  )
}

export const listGapHeight = Spacing.Thick24

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
    height: listGapHeight,
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
