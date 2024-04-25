import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { useNotifications } from 'src/home/NotificationCenter'
import NotificationBellIcon from 'src/icons/NotificationBellIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButtonV2 } from 'src/navigator/TopBarIconButtonV2'
import colors from 'src/styles/colors'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function NotificationBell({ testID, size, style }: Props) {
  const notifications = useNotifications()

  const hasNotifications = notifications.length > 0
  const notificationMark = hasNotifications ? colors.primary : undefined

  const onPress = () => {
    ValoraAnalytics.track(HomeEvents.notification_bell_pressed, { hasNotifications })
    navigate(Screens.NotificationCenter)
  }

  return (
    <TopBarIconButtonV2
      icon={<NotificationBellIcon size={size} notificationMark={notificationMark} />}
      testID={testID}
      onPress={onPress}
      style={style}
    />
  )
}
