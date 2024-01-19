import _ from 'lodash'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { createSelector } from 'reselect'
import { CleverTapInboxMessage, ExpectedCleverTapInboxMessage } from 'src/home/cleverTapInbox'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { isVersionInRange } from 'src/utils/versionCheck'

const homeNotificationsSelector = (state: RootState) => state.home.notifications

export const getExtraNotifications = createSelector(
  [homeNotificationsSelector, userLocationDataSelector],
  (notifications, userLocationData) => {
    const version = DeviceInfo.getVersion()
    const { countryCodeAlpha2 } = userLocationData
    return _.pickBy(notifications, (notification) => {
      return (
        !!notification &&
        !notification.dismissed &&
        isVersionInRange(version, notification.minVersion, notification.maxVersion) &&
        (notification.countries?.length
          ? !!countryCodeAlpha2 && notification.countries.includes(countryCodeAlpha2)
          : true) &&
        (notification.blockedCountries?.length
          ? !!countryCodeAlpha2 && !notification.blockedCountries.includes(countryCodeAlpha2)
          : true)
      )
    })
  }
)

export const cleverTapInboxMessagesSelector = createSelector(
  (state: RootState) => state.home.cleverTapInboxMessages,
  (rawMessages: ExpectedCleverTapInboxMessage[]) => {
    const CLEVERTAP_INBOX_TAG = 'CleverTapInbox'

    const messages: CleverTapInboxMessage[] = []

    if (!Array.isArray(rawMessages)) {
      Logger.error(CLEVERTAP_INBOX_TAG, 'Unexpected CleverTap Inbox messages format', {
        rawMessages,
      })

      return messages
    }

    for (const rawMessage of rawMessages) {
      const messageId = rawMessage.id ?? rawMessage._id
      const content = rawMessage.msg?.content?.[0]
      const header = content?.title?.text
      const text = content?.message?.text
      const iconUrl = content?.icon?.url
      const icon = iconUrl ? { uri: iconUrl } : undefined
      const action = content?.action?.links?.[0]
      const ctaText = action?.text
      const ctaUrl =
        Platform.OS === 'android'
          ? action?.url?.android?.text
          : Platform.OS === 'ios'
            ? action?.url?.ios?.text
            : ''

      const PRIORITY_TAG = 'priority:'
      const priority = Number(
        rawMessage.msg?.tags
          ?.find((tag: string) => tag.startsWith(PRIORITY_TAG))
          ?.slice(PRIORITY_TAG.length)
      )

      const openInExternalBrowser = rawMessage.msg?.tags?.includes('openInExternalBrowser') ?? false

      if (!messageId || !text || !ctaText || !ctaUrl) {
        Logger.error(CLEVERTAP_INBOX_TAG, 'Unexpected CleverTap Inbox message format', {
          messageId,
          text,
          ctaText,
          ctaUrl,
          rawMessage,
        })
        continue
      }

      messages.push({
        messageId,
        header,
        text,
        icon,
        ctaText,
        ctaUrl,
        priority: !Number.isNaN(priority) ? priority : undefined,
        openInExternalBrowser,
      })
    }

    return messages
  }
)
