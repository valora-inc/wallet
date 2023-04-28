import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Pagination from 'src/components/Pagination'
import SimpleMessagingCard, {
  Props as SimpleMessagingCardProps,
} from 'src/components/SimpleMessagingCard'
import { setCicoCompleted } from 'src/goldToken/actions'
import { boostRewards } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import useSelector from 'src/redux/useSelector'
import variables from 'src/styles/variables'

const TAG = 'NotificationBox'
// Priority of static notifications
const BACKUP_PRIORITY = 1000
const KOLEKTIVO_NOTIFICATTION_PRIORITY = 500

export enum NotificationBannerTypes {
  incoming_tx_request = 'incoming_tx_request',
  outgoing_tx_request = 'outgoing_tx_request',
  escrow_tx_summary = 'escrow_tx_summary',
  escrow_tx_pending = 'escrow_tx_pending',
  celo_asset_education = 'celo_asset_education',
  invite_prompt = 'invite_prompt',
  verification_prompt = 'verification_prompt',
  backup_prompt = 'backup_prompt',
  supercharge_available = 'supercharge_available',
  remote_notification = 'remote_notification',
  supercharging = 'supercharging',
  start_supercharging = 'start_supercharging',
  kolektivo_cico = 'kolektivo_cico',
}

export enum NotificationBannerCTATypes {
  read_more = 'read_more',
  accept = 'accept',
  decline = 'decline',
  review = 'review',
  reclaim = 'reclaim',
  remind = 'remind',
  pay = 'pay',
  remote_notification_cta = 'remote_notification_cta',
}

interface Notification {
  element: React.ReactElement
  priority: number
  id: string
}

/**
 * This function constructs a list of simple notifications to be displayed
 * to the user in the NotificationBox on the Wallet Home.
 * - Prompt to Buy kGuilder
 * @returns {Notification[]} Array of notifications to be displayed
 */
function useSimpleActions() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const kolektivoNotifications = useSelector(
    (state: RootState) => state.goldToken.kolektivoNotifications
  )

  const actions: SimpleMessagingCardProps[] = []

  if (kolektivoNotifications.cicoPrompt) {
    actions.push({
      id: 'cico',
      text: t('cicoPrompt.text'),
      icon: boostRewards,
      priority: KOLEKTIVO_NOTIFICATTION_PRIORITY,
      callToActions: [
        {
          text: t('moreInfo'),
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.kolektivo_cico,
              selectedAction: NotificationBannerCTATypes.read_more,
            })
            navigate(Screens.GuilderEducation)
          },
        },
        {
          text: t('close'),
          isSecondary: true,
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.kolektivo_cico,
              selectedAction: NotificationBannerCTATypes.decline,
            })
            dispatch(setCicoCompleted())
          },
        },
      ],
    })
  }

  return actions
}

function useNotifications() {
  const notifications: Notification[] = []

  const simpleActions = useSimpleActions()
  notifications.push(
    ...simpleActions.map((notification, i) => ({
      element: <SimpleMessagingCard key={i} testID={notification.id} {...notification} />,
      priority: notification.priority,
      id: notification.id,
    }))
  )

  return notifications.sort((n1, n2) => n2.priority - n1.priority)
}

function NotificationBox() {
  const [currentIndex, setCurrentIndex] = useState(0)
  // This variable tracks the last scrolled to notification, so that impression
  // events are not dispatched twice for the same notification
  const lastViewedIndex = useRef(-1)
  const notifications = useNotifications()

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / variables.width)

    if (nextIndex === currentIndex) {
      return
    }

    const direction = nextIndex > currentIndex ? ScrollDirection.next : ScrollDirection.previous
    ValoraAnalytics.track(HomeEvents.notification_scroll, { direction })

    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / variables.width))
  }

  useEffect(() => {
    if (notifications.length > 0 && lastViewedIndex.current < currentIndex) {
      ValoraAnalytics.track(HomeEvents.notification_impression, {
        notificationId: notifications[currentIndex].id,
      })
      lastViewedIndex.current = currentIndex
    }
  }, [currentIndex])

  if (!notifications.length) {
    // No notifications, no slider
    return null
  }

  return (
    <View style={styles.body}>
      <ScrollView
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        testID="CTA/ScrollContainer"
      >
        {notifications.map((notification) => (
          <View
            testID={`NotificationView/${notification.id}`}
            key={notification.id}
            style={styles.notificationContainer}
          >
            {notification.element}
          </View>
        ))}
      </ScrollView>
      <Pagination
        style={styles.pagination}
        count={notifications.length}
        activeIndex={currentIndex}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    maxWidth: variables.width,
    width: variables.width,
  },
  notificationContainer: {
    width: variables.width - 2 * variables.contentPadding,
    margin: variables.contentPadding,
    marginBottom: 24, // Enough space so the shadow is not clipped
  },
  pagination: {
    paddingBottom: variables.contentPadding,
  },
})

export default NotificationBox
