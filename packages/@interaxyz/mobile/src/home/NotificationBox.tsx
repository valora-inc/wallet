import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, StyleSheet, View } from 'react-native'
import { dismissGetVerified, dismissGoldEducation } from 'src/account/actions'
import { celoEducationCompletedSelector, cloudBackupCompletedSelector } from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import { openUrl } from 'src/app/actions'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import Pagination from 'src/components/Pagination'
import SimpleMessagingCard, {
  Props as SimpleMessagingCardProps,
} from 'src/components/SimpleMessagingCard'
import { dismissNotification } from 'src/home/actions'
import { DEFAULT_PRIORITY } from 'src/home/reducers'
import { getExtraNotifications } from 'src/home/selectors'
import { Notification, NotificationBannerCTATypes, NotificationType } from 'src/home/types'
import KeylessBackup from 'src/icons/KeylessBackup'
import GuideKeyIcon from 'src/images/GuideKeyIcon'
import { getVerified, learnCelo } from 'src/images/Images'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'
import { ONBOARDING_FEATURES_ENABLED } from 'src/config'
import { ToggleableOnboardingFeatures } from 'src/onboarding/types'

const TAG = 'NotificationBox'
// Priority of static notifications
const BACKUP_PRIORITY = 1000
const VERIFICATION_PRIORITY = 100
export const CLEVERTAP_PRIORITY = 500
const CELO_EDUCATION_PRIORITY = 10

interface SimpleAction extends SimpleMessagingCardProps {
  id: string
  priority: number
  showOnHomeScreen?: boolean
  type: NotificationType
}

export function useSimpleActions() {
  const { backupCompleted, dismissedGetVerified, dismissedGoldEducation } = useSelector(
    (state) => state.account
  )

  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)

  const celoEducationCompleted = useSelector(celoEducationCompletedSelector)

  const extraNotifications = useSelector(getExtraNotifications)

  const { t } = useTranslation()

  const dispatch = useDispatch()

  const showKeylessBackup = ONBOARDING_FEATURES_ENABLED[ToggleableOnboardingFeatures.CloudBackup]

  const cloudBackupCompleted = useSelector(cloudBackupCompletedSelector)

  const actions: SimpleAction[] = []
  if (!backupCompleted && !cloudBackupCompleted) {
    if (showKeylessBackup) {
      actions.push({
        id: NotificationType.keyless_backup_prompt,
        type: NotificationType.keyless_backup_prompt,
        text: t('keylessBackupNotification'),
        icon: <KeylessBackup />,
        priority: BACKUP_PRIORITY,
        testID: 'KeylessBackupNotification',
        callToActions: [
          {
            text: t('keylessBackupCTA'),
            onPress: (params) => {
              AppAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationType.keyless_backup_prompt,
                selectedAction: NotificationBannerCTATypes.accept,
                notificationId: NotificationType.keyless_backup_prompt,
                notificationPositionInList: params?.index,
              })
              ensurePincode()
                .then((pinIsCorrect) => {
                  if (pinIsCorrect) {
                    navigate(Screens.WalletSecurityPrimer)
                  }
                })
                .catch((error) => {
                  Logger.error(`${TAG}@keylessBackupNotification`, 'PIN ensure error', error)
                })
            },
          },
        ],
      })
    } else {
      actions.push({
        id: NotificationType.backup_prompt,
        type: NotificationType.backup_prompt,
        text: t('backupKeyNotification2'),
        icon: <GuideKeyIcon height={86} width={92} />,
        priority: BACKUP_PRIORITY,
        testID: 'BackupKeyNotification',
        callToActions: [
          {
            text: t('backupKeyCTA'),
            onPress: (params) => {
              AppAnalytics.track(HomeEvents.notification_select, {
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
            AppAnalytics.track(HomeEvents.notification_select, {
              notificationType: NotificationType.verification_prompt,
              selectedAction: NotificationBannerCTATypes.accept,
              notificationId: NotificationType.verification_prompt,
              notificationPositionInList: params?.index,
            })
            navigate(Screens.VerificationStartScreen, { hasOnboarded: true })
          },
        },
        {
          text: t('dismiss'),
          isSecondary: true,
          onPress: (params) => {
            AppAnalytics.track(HomeEvents.notification_select, {
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
            AppAnalytics.track(HomeEvents.notification_select, {
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
            AppAnalytics.track(HomeEvents.notification_select, {
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
            AppAnalytics.track(HomeEvents.notification_select, {
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
            AppAnalytics.track(HomeEvents.notification_select, {
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
    AppAnalytics.track(HomeEvents.notification_scroll, { direction })

    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / variables.width))
  }

  useEffect(() => {
    if (notifications.length > 0 && lastViewedIndex.current < currentIndex) {
      AppAnalytics.track(HomeEvents.notification_impression, {
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
