import Pagination from '@celo/react-components/components/Pagination'
import SimpleMessagingCard, {
  Props as SimpleMessagingCardProps,
} from '@celo/react-components/components/SimpleMessagingCard'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { dismissGetVerified, dismissGoldEducation } from 'src/account/actions'
import { HomeEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openUrl } from 'src/app/actions'
import { rewardsEnabledSelector, verificationPossibleSelector } from 'src/app/selectors'
import {
  RewardsScreenOrigin,
  trackRewardsScreenOpenEvent,
} from 'src/consumerIncentives/analyticsEventsTracker'
import EscrowedPaymentReminderSummaryNotification from 'src/escrow/EscrowedPaymentReminderSummaryNotification'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { dismissNotification } from 'src/home/actions'
import { DEFAULT_PRIORITY } from 'src/home/reducers'
import { getExtraNotifications } from 'src/home/selectors'
import { Namespaces } from 'src/i18n'
import { backupKey, getVerified, learnCelo } from 'src/images/Images'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import IncomingPaymentRequestSummaryNotification from 'src/paymentRequest/IncomingPaymentRequestSummaryNotification'
import OutgoingPaymentRequestSummaryNotification from 'src/paymentRequest/OutgoingPaymentRequestSummaryNotification'
import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import useSelector from 'src/redux/useSelector'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'
import Logger from 'src/utils/Logger'

const TAG = 'NotificationBox'
// Priority of static notifications
const BACKUP_PRIORITY = 1000
const VERIFICATION_PRIORITY = 100
const INVITES_PRIORITY = 400
const INCOMING_PAYMENT_REQUESTS_PRIORITY = 300
const OUTGOING_PAYMENT_REQUESTS_PRIORITY = 200
const CELO_EDUCATION_PRIORITY = 10

export enum NotificationBannerTypes {
  incoming_tx_request = 'incoming_tx_request',
  outgoing_tx_request = 'outgoing_tx_request',
  escrow_tx_summary = 'escrow_tx_summary',
  escrow_tx_pending = 'escrow_tx_pending',
  celo_asset_education = 'celo_asset_education',
  invite_prompt = 'invite_prompt',
  verification_prompt = 'verification_prompt',
  backup_prompt = 'backup_prompt',
  remote_notification = 'remote_notification',
}

export enum NotificationBannerCTATypes {
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
}

function useSimpleActions() {
  const { backupCompleted, dismissedGetVerified, dismissedGoldEducation } = useSelector(
    (state) => state.account
  )
  const numberVerified = useSelector((state) => state.app.numberVerified)
  const goldEducationCompleted = useSelector((state) => state.goldToken.educationCompleted)

  const extraNotifications = useSelector(getExtraNotifications)
  const verificationPossible = useSelector(verificationPossibleSelector)

  const rewardsEnabled = useSelector(rewardsEnabledSelector)

  const { t } = useTranslation(Namespaces.walletFlow5)

  const dispatch = useDispatch()

  const actions: SimpleMessagingCardProps[] = []
  if (!backupCompleted) {
    actions.push({
      text: t('backupKeyFlow6:backupKeyNotification'),
      icon: backupKey,
      priority: BACKUP_PRIORITY,
      callToActions: [
        {
          text: t('backupKeyFlow6:introPrimaryAction'),
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

  if (!dismissedGetVerified && !numberVerified && verificationPossible) {
    actions.push({
      text: t('notification.body'),
      icon: getVerified,
      priority: VERIFICATION_PRIORITY,
      callToActions: [
        {
          text: t('notification.cta'),
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.verification_prompt,
              selectedAction: NotificationBannerCTATypes.accept,
            })
            navigate(Screens.VerificationEducationScreen, {
              hideOnboardingStep: true,
            })
          },
        },
        {
          text: t('dismiss'),
          isSecondary: true,
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.verification_prompt,
              selectedAction: NotificationBannerCTATypes.decline,
            })
            dispatch(dismissGetVerified())
          },
        },
      ],
    })
  }

  for (const [id, notification] of Object.entries(extraNotifications)) {
    if (!notification) {
      continue
    }
    const texts = getContentForCurrentLang(notification.content)
    if (!texts) {
      continue
    }
    if (notification.ctaUri?.includes(Screens.ConsumerIncentivesHomeScreen) && !rewardsEnabled) {
      continue
    }

    actions.push({
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
            trackRewardsScreenOpenEvent(notification.ctaUri, RewardsScreenOrigin.NotificationBox)
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

  if (!dismissedGoldEducation && !goldEducationCompleted) {
    actions.push({
      text: t('whatIsGold'),
      icon: learnCelo,
      priority: CELO_EDUCATION_PRIORITY,
      callToActions: [
        {
          text: t('learnMore'),
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.celo_asset_education,
              selectedAction: NotificationBannerCTATypes.accept,
            })
            navigate(Screens.GoldEducation)
          },
        },
        {
          text: t('dismiss'),
          isSecondary: true,
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.celo_asset_education,
              selectedAction: NotificationBannerCTATypes.decline,
            })
            dispatch(dismissGoldEducation())
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
    })
  }

  const simpleActions = useSimpleActions()
  notifications.push(
    ...simpleActions.map((notification, i) => ({
      element: <SimpleMessagingCard key={i} {...notification} />,
      priority: notification.priority,
    }))
  )

  return notifications.sort((n1, n2) => n2.priority - n1.priority).map((n) => n.element)
}

function NotificationBox() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / variables.width)

    if (nextIndex === currentIndex) {
      return
    }

    const direction = nextIndex > currentIndex ? ScrollDirection.next : ScrollDirection.previous
    ValoraAnalytics.track(HomeEvents.notification_scroll, { direction })

    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / variables.width))
  }

  const notifications = useNotifications()

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
        {notifications.map((notification, i) => (
          <View key={i} style={styles.notificationContainer}>
            {notification}
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
