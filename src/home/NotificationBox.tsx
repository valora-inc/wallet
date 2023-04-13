import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'
import {
  dismissGetVerified,
  dismissGoldEducation,
  dismissKeepSupercharging,
  dismissStartSupercharging,
} from 'src/account/actions'
import { celoEducationCompletedSelector } from 'src/account/selectors'
import { HomeEvents, RewardsEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openUrl } from 'src/app/actions'
import {
  numberVerifiedSelector,
  phoneNumberVerifiedSelector,
  rewardsEnabledSelector,
} from 'src/app/selectors'
import Pagination from 'src/components/Pagination'
import SimpleMessagingCard, {
  Props as SimpleMessagingCardProps,
} from 'src/components/SimpleMessagingCard'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import {
  superchargeInfoSelector,
  userIsVerifiedForSuperchargeSelector,
} from 'src/consumerIncentives/selectors'
import { fetchAvailableRewards } from 'src/consumerIncentives/slice'
import EscrowedPaymentReminderSummaryNotification from 'src/escrow/EscrowedPaymentReminderSummaryNotification'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { dismissNotification } from 'src/home/actions'
import { DEFAULT_PRIORITY } from 'src/home/reducers'
import { getExtraNotifications } from 'src/home/selectors'
import GuideKeyIcon from 'src/icons/GuideKeyHomeCardIcon'
import { backupKey, boostRewards, getVerified, learnCelo, lightningPhone } from 'src/images/Images'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import IncomingPaymentRequestSummaryNotification from 'src/paymentRequest/IncomingPaymentRequestSummaryNotification'
import OutgoingPaymentRequestSummaryNotification from 'src/paymentRequest/OutgoingPaymentRequestSummaryNotification'
import {
  getIncomingPaymentRequests,
  getOutgoingPaymentRequests,
} from 'src/paymentRequest/selectors'
import useSelector from 'src/redux/useSelector'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import variables from 'src/styles/variables'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'
import Logger from 'src/utils/Logger'

const TAG = 'NotificationBox'
// Priority of static notifications
const BACKUP_PRIORITY = 1000
const VERIFICATION_PRIORITY = 100
const INVITES_PRIORITY = 400
const INCOMING_PAYMENT_REQUESTS_PRIORITY = 900
const OUTGOING_PAYMENT_REQUESTS_PRIORITY = 200
const CELO_EDUCATION_PRIORITY = 10
const SUPERCHARGE_AVAILABLE_PRIORITY = 950
const SUPERCHARGE_INFO_PRIORITY = 440
const REVERIFY_ON_CPV_PRIORITY = 990

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
  reverify_using_CPV = 'reverify_using_CPV',
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
  id: string
}

function useSimpleActions() {
  const {
    backupCompleted,
    dismissedGetVerified,
    dismissedGoldEducation,
    dismissedKeepSupercharging,
    dismissedStartSupercharging,
  } = useSelector((state) => state.account)

  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const numberVerifiedDecentrally = useSelector(numberVerifiedSelector)

  const numberVerifiedForSupercharge = useSelector(userIsVerifiedForSuperchargeSelector)
  const celoEducationCompleted = useSelector(celoEducationCompletedSelector)

  const extraNotifications = useSelector(getExtraNotifications)

  const { hasBalanceForSupercharge } = useSelector(superchargeInfoSelector)
  const isSupercharging = numberVerifiedForSupercharge && hasBalanceForSupercharge

  const rewardsEnabled = useSelector(rewardsEnabledSelector)

  const { superchargeApy } = useSelector((state) => state.app)

  const { t } = useTranslation()

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchAvailableRewards())
  }, [])

  const superchargeRewards = useSelector((state) => state.supercharge.availableRewards)

  const actions: SimpleMessagingCardProps[] = []
  if (!backupCompleted) {
    const { useNewBackupHomeCard } = getExperimentParams(
      ExperimentConfigs[StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING]
    )
    const text = useNewBackupHomeCard ? t('backupKeyNotification2') : t('backupKeyNotification')
    const icon = useNewBackupHomeCard ? <GuideKeyIcon /> : backupKey
    const ctaText = useNewBackupHomeCard ? t('backupKeyCTA') : t('introPrimaryAction')
    actions.push({
      id: 'backup',
      text,
      icon,
      priority: BACKUP_PRIORITY,
      testID: 'BackupKeyNotification',
      callToActions: [
        {
          text: ctaText,
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

  if (numberVerifiedDecentrally && !phoneNumberVerified) {
    actions.push({
      id: 'reverifyUsingCPV',
      text: t('reverifyUsingCPVHomecard.description'),
      icon: lightningPhone,
      priority: REVERIFY_ON_CPV_PRIORITY,
      callToActions: [
        {
          text: t('reverifyUsingCPVHomecard.buttonLabel'),
          onPress: () => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationBannerTypes.reverify_using_CPV,
              selectedAction: NotificationBannerCTATypes.accept,
            })
            navigate(Screens.VerificationStartScreen, { hideOnboardingStep: true })
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
    } else {
      if (isSupercharging && !dismissedKeepSupercharging) {
        actions.push({
          id: 'keepSupercharging',
          text: t('superchargingNotificationBodyV1_33', { apy: superchargeApy }),
          icon: boostRewards,
          priority: SUPERCHARGE_INFO_PRIORITY,
          callToActions: [
            {
              text: t('superchargingNotificationStart'),
              onPress: () => {
                ValoraAnalytics.track(HomeEvents.notification_select, {
                  notificationType: NotificationBannerTypes.supercharging,
                  selectedAction: NotificationBannerCTATypes.accept,
                })
                navigate(Screens.ConsumerIncentivesHomeScreen)
                ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
                  origin: RewardsScreenOrigin.SuperchargingNotification,
                })
              },
            },
            {
              text: t('dismiss'),
              isSecondary: true,
              onPress: () => {
                ValoraAnalytics.track(HomeEvents.notification_select, {
                  notificationType: NotificationBannerTypes.supercharging,
                  selectedAction: NotificationBannerCTATypes.decline,
                })
                dispatch(dismissKeepSupercharging())
              },
            },
          ],
        })
      }

      if (!isSupercharging && !dismissedStartSupercharging) {
        actions.push({
          id: 'startSupercharging',
          text: t('startSuperchargingNotificationBody'),
          icon: boostRewards,
          priority: SUPERCHARGE_INFO_PRIORITY,
          callToActions: [
            {
              text: t('startSuperchargingNotificationStart'),
              onPress: () => {
                ValoraAnalytics.track(HomeEvents.notification_select, {
                  notificationType: NotificationBannerTypes.start_supercharging,
                  selectedAction: NotificationBannerCTATypes.accept,
                })
                navigate(Screens.ConsumerIncentivesHomeScreen)
                ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
                  origin: RewardsScreenOrigin.StartSuperchargingNotification,
                })
              },
            },
            {
              text: t('dismiss'),
              isSecondary: true,
              onPress: () => {
                ValoraAnalytics.track(HomeEvents.notification_select, {
                  notificationType: NotificationBannerTypes.supercharging,
                  selectedAction: NotificationBannerCTATypes.decline,
                })
                dispatch(dismissStartSupercharging())
              },
            },
          ],
        })
      }
    }
  }

  if (!dismissedGetVerified && !phoneNumberVerified) {
    actions.push({
      id: 'getVerified',
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
            navigate(Screens.VerificationStartScreen, {
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

  if (!dismissedGoldEducation && !celoEducationCompleted) {
    actions.push({
      id: 'celoEducation',
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
  },
  pagination: {
    paddingBottom: variables.contentPadding,
  },
})

export default NotificationBox
