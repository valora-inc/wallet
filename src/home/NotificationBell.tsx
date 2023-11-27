import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { useNotifications } from 'src/home/NotificationCenter'
import NotificationBellIcon from 'src/icons/NotificationBellIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function NotificationBell({ style, size, testID }: Props) {
  const notifications = useNotifications()

  const hasNotifications = notifications.length > 0
  const notificationMark = hasNotifications ? colors.primary : undefined

  const onPress = () => {
    ValoraAnalytics.track(HomeEvents.notification_bell_pressed, {
      hasNotifications,
    })
    navigate(Screens.NotificationCenter)
  }

  return (
    <TopBarIconButton
      testID={testID}
      icon={<NotificationBellIcon size={size} notificationMark={notificationMark} />}
      onPress={onPress}
      style={style}
    />
  )
}
