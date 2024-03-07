import { NativeStackScreenProps } from '@react-navigation/native-stack'
import CleverTap from 'clevertap-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View, ViewToken } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openUrl } from 'src/app/actions'
import { CallToAction } from 'src/components/CallToActionsBar'
import SimpleMessagingCard from 'src/components/SimpleMessagingCard'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { CLEVERTAP_PRIORITY, INVITES_PRIORITY, useSimpleActions } from 'src/home/NotificationBox'
import { cleverTapInboxMessagesSelector } from 'src/home/selectors'
import { Notification, NotificationBannerCTATypes, NotificationType } from 'src/home/types'
import ThumbsUpIllustration from 'src/icons/ThumbsUpIllustration'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type NotificationsProps = NativeStackScreenProps<StackParamList, Screens.NotificationCenter>

function useCleverTapNotifications() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const messages = useSelector(cleverTapInboxMessagesSelector)

  return useMemo(() => {
    const notifications: Notification[] = []

    for (const {
      messageId,
      header,
      text,
      icon,
      ctaText,
      ctaUrl,
      priority,
      openInExternalBrowser,
    } of messages) {
      const notificationId = `${NotificationType.clevertap_notification}/${messageId}`
      const callToActions: CallToAction[] = [
        {
          text: ctaText,
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.clevertap_notification,
              selectedAction: NotificationBannerCTATypes.accept,
              notificationId,
              notificationPositionInList: params?.index,
            })
            CleverTap.pushInboxNotificationClickedEventForId(messageId)

            const isSecureOrigin = true
            dispatch(openUrl(ctaUrl, openInExternalBrowser, isSecureOrigin))
          },
        },
        {
          text: t('dismiss'),
          isSecondary: true,
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.clevertap_notification,
              selectedAction: NotificationBannerCTATypes.decline,
              notificationId,
              notificationPositionInList: params?.index,
            })

            CleverTap.deleteInboxMessageForId(messageId)
          },
        },
      ]
      notifications.push({
        renderElement: (params?: { index?: number }) => (
          <SimpleMessagingCard
            callToActions={callToActions}
            header={header}
            text={text}
            icon={icon}
            testID={notificationId}
            index={params?.index}
          />
        ),
        priority: priority || CLEVERTAP_PRIORITY,
        showOnHomeScreen: false,
        id: notificationId,
        type: NotificationType.clevertap_notification,
        onView: () => {
          CleverTap.pushInboxNotificationViewedEventForId(messageId)
          CleverTap.markReadInboxMessageForId(messageId)
        },
      })
    }

    return notifications
  }, [messages])
}

export function useNotifications() {
  const notifications: Notification[] = []

  // Pending outgoing invites in escrow
  const reclaimableEscrowPayments = useSelector(getReclaimableEscrowPayments)
  if (reclaimableEscrowPayments && reclaimableEscrowPayments.length) {
    for (const payment of reclaimableEscrowPayments) {
      const itemPriority = Number(`${INVITES_PRIORITY}.${payment.timestamp.toString()}`)

      notifications.push({
        renderElement: (params?: { index?: number }) => (
          <EscrowedPaymentListItem payment={payment} index={params?.index} />
        ),
        priority: !Number.isNaN(itemPriority) ? itemPriority : INVITES_PRIORITY,
        id: `${NotificationType.escrow_tx_summary}/${payment.paymentID}`,
        type: NotificationType.escrow_tx_summary,
      })
    }
  }

  const simpleActions = useSimpleActions()
  notifications.push(
    ...simpleActions.map((notification) => ({
      renderElement: (params?: { index?: number }) => (
        <SimpleMessagingCard {...notification} testID={notification.id} index={params?.index} />
      ),
      priority: notification.priority,
      showOnHomeScreen: notification.showOnHomeScreen,
      id: notification.id,
      type: notification.type,
    }))
  )

  const cleverTapNotifications = useCleverTapNotifications()
  notifications.push(...cleverTapNotifications)

  return (
    notifications
      .sort((n1, n2) => n2.priority - n1.priority)
      // Hide notifications that should only be shown on the home screen
      .filter((n) => !n.showOnHomeScreen)
  )
}

export default function Notifications({ navigation }: NotificationsProps) {
  const safeAreaInsets = useSafeAreaInsets()

  const { t } = useTranslation()
  const title = t('notifications')

  const notifications = useNotifications()

  // Changing onViewableItemsChanged on the fly is not supported.
  // This is a workaround to provide handleViewableItemsChanged with
  // actual notifications array while keeping its dependecy list empty.
  const notificationsRef = useRef<Notification[]>([])
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

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
      viewableItems.forEach(({ item }: { item: Notification }) => {
        if (!seenNotifications.current.has(item.id)) {
          seenNotifications.current.add(item.id)

          ValoraAnalytics.track(HomeEvents.notification_impression, {
            notificationId: item.id,
            notificationType: item.type,
            notificationPositionInList: notificationsRef.current.findIndex(
              ({ id }) => id === item.id
            ),
          })

          item.onView?.()
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

  const renderItem = ({ item, index }: { item: Notification; index: number }) => {
    return (
      <View testID={`NotificationView/${item.id}`} key={item.id} style={styles.listItem}>
        {item.renderElement({ index })}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...fontStyles.large600,
    fontSize: 24,
    lineHeight: 32,
    color: colors.black,
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
