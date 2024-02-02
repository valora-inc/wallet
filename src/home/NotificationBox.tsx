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
  numberVerifiedDecentrallySelector,
  phoneNumberVerifiedSelector,
  rewardsEnabledSelector,
} from 'src/app/selectors'
import Pagination from 'src/components/Pagination'
import SimpleMessagingCard, {
  Props as SimpleMessagingCardProps,
} from 'src/components/SimpleMessagingCard'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import { superchargeInfoSelector } from 'src/consumerIncentives/selectors'
import { fetchAvailableRewards } from 'src/consumerIncentives/slice'
import EscrowedPaymentReminderSummaryNotification from 'src/escrow/EscrowedPaymentReminderSummaryNotification'
import { getReclaimableEscrowPayments } from 'src/escrow/reducer'
import { dismissNotification } from 'src/home/actions'
import { DEFAULT_PRIORITY } from 'src/home/reducers'
import { getExtraNotifications } from 'src/home/selectors'
import { Notification, NotificationBannerCTATypes, NotificationType } from 'src/home/types'
import GuideKeyIcon from 'src/icons/GuideKeyHomeCardIcon'
import { boostRewards, getVerified, learnCelo, lightningPhone } from 'src/images/Images'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import variables from 'src/styles/variables'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'
import Logger from 'src/utils/Logger'

const TAG = 'NotificationBox'
// Priority of static notifications
const BACKUP_PRIORITY = 1000
const VERIFICATION_PRIORITY = 100
export const CLEVERTAP_PRIORITY = 500
export const INVITES_PRIORITY = 400
const CELO_EDUCATION_PRIORITY = 10
const SUPERCHARGE_AVAILABLE_PRIORITY = 950
const SUPERCHARGE_INFO_PRIORITY = 440
const REVERIFY_ON_CPV_PRIORITY = 990

interface SimpleAction extends SimpleMessagingCardProps {
  id: string
  priority: number
  showOnHomeScreen?: boolean
  type: NotificationType
}

export function useSimpleActions() {
  const {
    backupCompleted,
    dismissedGetVerified,
    dismissedGoldEducation,
    dismissedKeepSupercharging,
    dismissedStartSupercharging,
  } = useSelector((state) => state.account)

  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const numberVerifiedDecentrally = useSelector(numberVerifiedDecentrallySelector)

  const celoEducationCompleted = useSelector(celoEducationCompletedSelector)

  const extraNotifications = useSelector(getExtraNotifications)

  const { hasBalanceForSupercharge } = useSelector(superchargeInfoSelector)
  const isSupercharging = phoneNumberVerified && hasBalanceForSupercharge

  const rewardsEnabled = useSelector(rewardsEnabledSelector)

  const { superchargeApy } = useSelector((state) => state.app)

  const { t } = useTranslation()

  const dispatch = useDispatch()

  const restrictSuperchargeForClaimOnly = getFeatureGate(
    StatsigFeatureGates.RESTRICT_SUPERCHARGE_FOR_CLAIM_ONLY
  )

  useEffect(() => {
    dispatch(fetchAvailableRewards())
  }, [])

  const superchargeRewards = useSelector((state) => state.supercharge.availableRewards)

  const actions: SimpleAction[] = []
  if (!backupCompleted) {
    actions.push({
      id: NotificationType.backup_prompt,
      type: NotificationType.backup_prompt,
      text: t('backupKeyNotification2'),
      icon: <GuideKeyIcon />,
      priority: BACKUP_PRIORITY,
      testID: 'BackupKeyNotification',
      callToActions: [
        {
          text: t('backupKeyCTA'),
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.backup_prompt,
              selectedAction: NotificationBannerCTATypes.accept,
              notificationId: NotificationType.backup_prompt,
              notificationPositionInList: params?.index,
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
      id: NotificationType.reverify_using_CPV,
      type: NotificationType.reverify_using_CPV,
      text: t('reverifyUsingCPVHomecard.description'),
      icon: lightningPhone,
      priority: REVERIFY_ON_CPV_PRIORITY,
      callToActions: [
        {
          text: t('reverifyUsingCPVHomecard.buttonLabel'),
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.reverify_using_CPV,
              selectedAction: NotificationBannerCTATypes.accept,
              notificationId: NotificationType.reverify_using_CPV,
              notificationPositionInList: params?.index,
            })
            navigate(Screens.VerificationStartScreen)
          },
        },
      ],
    })
  }

  if (rewardsEnabled) {
    if (superchargeRewards.length > 0) {
      actions.push({
        id: NotificationType.supercharge_available,
        type: NotificationType.supercharge_available,
        text: t('superchargeNotificationBody'),
        icon: boostRewards,
        priority: SUPERCHARGE_AVAILABLE_PRIORITY,
        callToActions: [
          {
            text: t('superchargeNotificationStart'),
            onPress: (params) => {
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationType.supercharge_available,
                selectedAction: NotificationBannerCTATypes.accept,
                notificationId: NotificationType.supercharge_available,
                notificationPositionInList: params?.index,
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
          id: NotificationType.supercharging,
          type: NotificationType.supercharging,
          text: t('superchargingNotificationBodyV1_33', { apy: superchargeApy }),
          icon: boostRewards,
          priority: SUPERCHARGE_INFO_PRIORITY,
          callToActions: [
            {
              text: t('superchargingNotificationStart'),
              onPress: (params) => {
                ValoraAnalytics.track(HomeEvents.notification_select, {
                  notificationType: NotificationType.supercharging,
                  selectedAction: NotificationBannerCTATypes.accept,
                  notificationId: NotificationType.supercharging,
                  notificationPositionInList: params?.index,
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
              onPress: (params) => {
                ValoraAnalytics.track(HomeEvents.notification_select, {
                  notificationType: NotificationType.supercharging,
                  selectedAction: NotificationBannerCTATypes.decline,
                  notificationId: NotificationType.supercharging,
                  notificationPositionInList: params?.index,
                })
                dispatch(dismissKeepSupercharging())
              },
            },
          ],
        })
      }

      if (!isSupercharging && !restrictSuperchargeForClaimOnly && !dismissedStartSupercharging) {
        actions.push({
          id: NotificationType.start_supercharging,
          type: NotificationType.start_supercharging,
          text: t('startSuperchargingNotificationBody'),
          icon: boostRewards,
          priority: SUPERCHARGE_INFO_PRIORITY,
          callToActions: [
            {
              text: t('startSuperchargingNotificationStart'),
              onPress: (params) => {
                ValoraAnalytics.track(HomeEvents.notification_select, {
                  notificationType: NotificationType.start_supercharging,
                  selectedAction: NotificationBannerCTATypes.accept,
                  notificationId: NotificationType.start_supercharging,
                  notificationPositionInList: params?.index,
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
              onPress: (params) => {
                ValoraAnalytics.track(HomeEvents.notification_select, {
                  notificationType: NotificationType.start_supercharging,
                  selectedAction: NotificationBannerCTATypes.decline,
                  notificationId: NotificationType.start_supercharging,
                  notificationPositionInList: params?.index,
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
      id: NotificationType.verification_prompt,
      type: NotificationType.verification_prompt,
      text: t('notification.body'),
      icon: getVerified,
      priority: VERIFICATION_PRIORITY,
      callToActions: [
        {
          text: t('notification.cta'),
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.verification_prompt,
              selectedAction: NotificationBannerCTATypes.accept,
              notificationId: NotificationType.verification_prompt,
              notificationPositionInList: params?.index,
            })
            navigate(Screens.VerificationStartScreen)
          },
        },
        {
          text: t('dismiss'),
          isSecondary: true,
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.verification_prompt,
              selectedAction: NotificationBannerCTATypes.decline,
              notificationId: NotificationType.verification_prompt,
              notificationPositionInList: params?.index,
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
      type: NotificationType.remote_notification,
      text: texts.body,
      icon: notification.iconUrl ? { uri: notification.iconUrl } : undefined,
      priority: notification.priority ?? DEFAULT_PRIORITY,
      showOnHomeScreen: notification.showOnHomeScreen,
      callToActions: [
        {
          text: texts.cta,
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.remote_notification,
              selectedAction: NotificationBannerCTATypes.remote_notification_cta,
              notificationId: id,
              notificationPositionInList: params?.index,
            })
            dispatch(openUrl(notification.ctaUri, notification.openExternal, true))
          },
        },
        {
          text: texts.dismiss,
          isSecondary: true,
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.remote_notification,
              selectedAction: NotificationBannerCTATypes.decline,
              notificationId: id,
              notificationPositionInList: params?.index,
            })
            dispatch(dismissNotification(id))
          },
        },
      ],
    })
  }

  if (!dismissedGoldEducation && !celoEducationCompleted) {
    actions.push({
      id: NotificationType.celo_asset_education,
      type: NotificationType.celo_asset_education,
      text: t('whatIsGold'),
      icon: learnCelo,
      priority: CELO_EDUCATION_PRIORITY,
      callToActions: [
        {
          text: t('learnMore'),
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.celo_asset_education,
              selectedAction: NotificationBannerCTATypes.accept,
              notificationId: NotificationType.celo_asset_education,
              notificationPositionInList: params?.index,
            })
            navigate(Screens.GoldEducation)
          },
        },
        {
          text: t('dismiss'),
          isSecondary: true,
          onPress: (params) => {
            ValoraAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.celo_asset_education,
              selectedAction: NotificationBannerCTATypes.decline,
              notificationId: NotificationType.celo_asset_education,
              notificationPositionInList: params?.index,
            })
            dispatch(dismissGoldEducation())
          },
        },
      ],
    })
  }

  return actions
}

export function useNotifications({
  showOnlyHomeScreenNotifications,
}: {
  showOnlyHomeScreenNotifications: boolean
}) {
  const notifications: Notification[] = []

  // Pending outgoing invites in escrow
  const reclaimableEscrowPayments = useSelector(getReclaimableEscrowPayments)
  if (reclaimableEscrowPayments && reclaimableEscrowPayments.length) {
    notifications.push({
      renderElement: () => (
        <EscrowedPaymentReminderSummaryNotification key={1} payments={reclaimableEscrowPayments} />
      ),
      priority: INVITES_PRIORITY,
      id: NotificationType.escrow_tx_summary,
      type: NotificationType.escrow_tx_summary,
    })
  }

  const simpleActions = useSimpleActions()
  notifications.push(
    ...simpleActions.map((notification, i) => ({
      renderElement: () => (
        <SimpleMessagingCard key={i} testID={notification.id} {...notification} />
      ),
      priority: notification.priority,
      showOnHomeScreen: notification.showOnHomeScreen,
      id: notification.id,
      type: notification.type,
    }))
  )

  return notifications
    .sort((n1, n2) => n2.priority - n1.priority)
    .filter((n) => {
      if (showOnlyHomeScreenNotifications) {
        return n.showOnHomeScreen
      }
      return true
    })
}

interface Props {
  showOnlyHomeScreenNotifications: boolean
}

function NotificationBox({ showOnlyHomeScreenNotifications }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  // This variable tracks the last scrolled to notification, so that impression
  // events are not dispatched twice for the same notification
  const lastViewedIndex = useRef(-1)
  const notifications = useNotifications({ showOnlyHomeScreenNotifications })

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
        notificationType: notifications[currentIndex].type,
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
            {notification.renderElement()}
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
