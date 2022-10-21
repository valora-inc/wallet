import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { HomeEvents, RewardsEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openUrl } from 'src/app/actions'
import { rewardsEnabledSelector, verificationPossibleSelector } from 'src/app/selectors'
import Pagination from 'src/components/Pagination'
import SimpleMessagingCard, {
  Props as SimpleMessagingCardProps,
} from 'src/components/SimpleMessagingCard'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import { useHasBalanceForSupercharge } from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import { fetchAvailableRewards } from 'src/consumerIncentives/slice'
import EscrowedPaymentReminderSummaryNotification from 'src/escrow/EscrowedPaymentReminderSummaryNotification'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { dismissNotification } from 'src/home/actions'
import { DEFAULT_PRIORITY } from 'src/home/reducers'
import { getExtraNotifications } from 'src/home/selectors'
import { backupKey, boostRewards } from 'src/images/Images'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import IncomingPaymentRequestSummaryNotification from 'src/paymentRequest/IncomingPaymentRequestSummaryNotification'
import OutgoingPaymentRequestSummaryNotification from 'src/paymentRequest/OutgoingPaymentRequestSummaryNotification'
import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import useSelector from 'src/redux/useSelector'
import variables from 'src/styles/variables'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'
import Logger from 'src/utils/Logger'

const TAG = 'NotificationBox'
// Priority of static notifications
const BACKUP_PRIORITY = 1000
const KOLEKTIVO_NOTIFICATTION_PRIORITY = 975
const VERIFICATION_PRIORITY = 100
const INVITES_PRIORITY = 400
const INCOMING_PAYMENT_REQUESTS_PRIORITY = 900
const OUTGOING_PAYMENT_REQUESTS_PRIORITY = 200
const CELO_EDUCATION_PRIORITY = 10
const SUPERCHARGE_AVAILABLE_PRIORITY = 950
const SUPERCHARGE_INFO_PRIORITY = 440

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

function useSimpleActions() {
  const { backupCompleted } = useSelector((state) => state.account)

  const numberVerified = useSelector((state) => state.app.numberVerified)
  const goldEducationCompleted = useSelector((state) => state.goldToken.educationCompleted)

  const extraNotifications = useSelector(getExtraNotifications)

  const kolektivoNotifications = useSelector((state) => state.goldToken.kolektivoNotifications)

  const verificationPossible = useSelector(verificationPossibleSelector)

  const { hasBalanceForSupercharge } = useHasBalanceForSupercharge()
  const isSupercharging = numberVerified && hasBalanceForSupercharge

  const rewardsEnabled = useSelector(rewardsEnabledSelector)

  const { superchargeApy } = useSelector((state) => state.app)

  const { t } = useTranslation()

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchAvailableRewards())
  }, [])

  const superchargeRewards = useSelector((state) => state.supercharge.availableRewards)

  const actions: SimpleMessagingCardProps[] = []

  if (kolektivoNotifications.cicoPrompt) {
    actions.push({
      id: 'cico',
      text: t('cicoPrompt.text'),
      icon: boostRewards,
      priority: KOLEKTIVO_NOTIFICATTION_PRIORITY,
      callToActions: [
        {
          text: 'Read More',
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.kolektivo_cico,
              selectedAction: NotificationBannerCTATypes.read_more,
            })
            navigate(Screens.GuilderEducation)
          },
        },
      ],
    })
  }

  if (!backupCompleted) {
    actions.push({
      id: 'backup',
      text: t('backupKeyNotification'),
      icon: backupKey,
      priority: BACKUP_PRIORITY,
      callToActions: [
        {
          text: t('introPrimaryAction'),
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.backup_prompt,
              selectedAction: NotificationBannerCTATypes.accept,
            })
            ensurePincode()
              .then((pinIsCorrect) => {
                if (pinIsCorrect) {
                  navigate(Screens.BackupIntroduction)
                }
              })
              .catch((error) => {
                Logger.error(`${TAG}@backupNotification`, 'PIN ensure error', error)
              })
          },
        },
      ],
    })
  }

  if (rewardsEnabled) {
    if (superchargeRewards.length > 0) {
      actions.push({
        id: 'claimSuperchargeRewards',
        text: t('superchargeNotificationBody'),
        icon: boostRewards,
        priority: SUPERCHARGE_AVAILABLE_PRIORITY,
        callToActions: [
          {
            text: t('superchargeNotificationStart'),
            onPress: () => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.supercharge_available,
                selectedAction: NotificationBannerCTATypes.accept,
              })
              navigate(Screens.ConsumerIncentivesHomeScreen)
              ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
                origin: RewardsScreenOrigin.RewardAvailableNotification,
              })
            },
          },
        ],
      })
    }
  }

  for (const [id, notification] of Object.entries(extraNotifications)) {
    if (!notification) {
      continue
    }
    const texts = getContentForCurrentLang(notification.content)
    if (!texts) {
      continue
    }

    actions.push({
      id,
      text: texts.body,
      icon: notification.iconUrl ? { uri: notification.iconUrl } : undefined,
      priority: notification.priority ?? DEFAULT_PRIORITY,
      callToActions: [
        {
          text: texts.cta,
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.remote_notification,
              selectedAction: NotificationBannerCTATypes.remote_notification_cta,
              notificationId: id,
            })
            dispatch(openUrl(notification.ctaUri, notification.openExternal, true))
          },
        },
        {
          text: texts.dismiss,
          isSecondary: true,
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.remote_notification,
              selectedAction: NotificationBannerCTATypes.decline,
              notificationId: id,
            })
            dispatch(dismissNotification(id))
          },
        },
      ],
    })
  }

  return actions
}

function useNotifications() {
  const notifications: Notification[] = []

  // Pending outgoing invites in escrow
  const reclaimableEscrowPayments = useSelector(getReclaimableEscrowPayments)
  if (reclaimableEscrowPayments && reclaimableEscrowPayments.length) {
    notifications.push({
      element: (
        <EscrowedPaymentReminderSummaryNotification key={1} payments={reclaimableEscrowPayments} />
      ),
      priority: INVITES_PRIORITY,
      id: 'reclaimInvite',
    })
  }

  // Incoming payment requests
  const incomingPaymentRequests = useSelector(getIncomingPaymentRequests)
  if (incomingPaymentRequests && incomingPaymentRequests.length) {
    notifications.push({
      element: (
        <IncomingPaymentRequestSummaryNotification key={1} requests={incomingPaymentRequests} />
      ),
      priority: INCOMING_PAYMENT_REQUESTS_PRIORITY,
      id: 'incomingPaymentRequest',
    })
  }

  // Outgoing payment requests
  const outgoingPaymentRequests = useSelector(getOutgoingPaymentRequests)
  if (outgoingPaymentRequests && outgoingPaymentRequests.length) {
    notifications.push({
      element: (
        <OutgoingPaymentRequestSummaryNotification key={1} requests={outgoingPaymentRequests} />
      ),
      priority: OUTGOING_PAYMENT_REQUESTS_PRIORITY,
      id: 'outgoingPaymentRequest',
    })
  }

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
