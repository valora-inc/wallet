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
import { dismissGetVerified, dismissGoldEducation, dismissInviteFriends } from 'src/account/actions'
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
import { pausedFeatures } from 'src/flags'
import { dismissNotification } from 'src/home/actions'
import { getExtraNotifications } from 'src/home/selectors'
import { Namespaces } from 'src/i18n'
import { backupKey, getVerified, inviteFriends, learnCelo } from 'src/images/Images'
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

function NotificationBox() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const {
    backupCompleted,
    dismissedInviteFriends,
    dismissedGetVerified,
    dismissedGoldEducation,
  } = useSelector((state) => state.account)
  const numberVerified = useSelector((state) => state.app.numberVerified)
  const goldEducationCompleted = useSelector((state) => state.goldToken.educationCompleted)
  const incomingPaymentRequests = useSelector(getIncomingPaymentRequests)
  const outgoingPaymentRequests = useSelector(getOutgoingPaymentRequests)
  const extraNotifications = useSelector(getExtraNotifications)
  const verificationPossible = useSelector(verificationPossibleSelector)
  const reclaimableEscrowPayments = useSelector(getReclaimableEscrowPayments)
  const rewardsEnabled = useSelector(rewardsEnabledSelector)

  const { t } = useTranslation(Namespaces.walletFlow5)

  const dispatch = useDispatch()

  const escrowedPaymentReminderNotification = () => {
    if (reclaimableEscrowPayments && reclaimableEscrowPayments.length) {
      return [
        <EscrowedPaymentReminderSummaryNotification key={1} payments={reclaimableEscrowPayments} />,
      ]
    }
    return []
  }

  const incomingPaymentRequestsNotification = (): Array<React.ReactElement<any>> => {
    if (incomingPaymentRequests && incomingPaymentRequests.length) {
      return [
        <IncomingPaymentRequestSummaryNotification key={1} requests={incomingPaymentRequests} />,
      ]
    }
    return []
  }

  const outgoingPaymentRequestsNotification = (): Array<React.ReactElement<any>> => {
    if (outgoingPaymentRequests && outgoingPaymentRequests.length) {
      return [
        <OutgoingPaymentRequestSummaryNotification key={1} requests={outgoingPaymentRequests} />,
      ]
    }
    return []
  }

  const generalNotifications = (): Array<React.ReactElement<any>> => {
    const actions: SimpleMessagingCardProps[] = []

    if (!backupCompleted) {
      actions.push({
        text: t('backupKeyFlow6:backupKeyNotification'),
        icon: backupKey,
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
        text: t('nuxVerification2:notification.body'),
        icon: getVerified,
        callToActions: [
          {
            text: t('nuxVerification2:notification.cta'),
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
            text: t('global:dismiss'),
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
        darkMode: notification.darkMode,
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
            dim: notification.darkMode,
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
        text: t('exchangeFlow9:whatIsGold'),
        icon: learnCelo,
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
            text: t('global:dismiss'),
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

    if (!dismissedInviteFriends && !pausedFeatures.INVITE) {
      actions.push({
        text: t('inviteFlow11:inviteAnyone'),
        icon: inviteFriends,
        callToActions: [
          {
            text: t('global:connect'),
            onPress: () => {
              dispatch(dismissInviteFriends())
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.invite_prompt,
                selectedAction: NotificationBannerCTATypes.accept,
              })
              // TODO: navigate to relevant invite flow
            },
          },
          {
            text: t('global:remind'),
            onPress: () => {
              dispatch(dismissInviteFriends())
              ValoraAnalytics.track(HomeEvents.notification_select, {
                notificationType: NotificationBannerTypes.invite_prompt,
                selectedAction: NotificationBannerCTATypes.decline,
              })
            },
          },
        ],
      })
    }

    return actions.map((notification, i) => <SimpleMessagingCard key={i} {...notification} />)
  }

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / variables.width)

    if (nextIndex === currentIndex) {
      return
    }

    const direction = nextIndex > currentIndex ? ScrollDirection.next : ScrollDirection.previous
    ValoraAnalytics.track(HomeEvents.notification_scroll, { direction })

    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / variables.width))
  }

  const notifications = [
    ...incomingPaymentRequestsNotification(),
    ...outgoingPaymentRequestsNotification(),
    ...escrowedPaymentReminderNotification(),
    ...generalNotifications(),
  ]

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
