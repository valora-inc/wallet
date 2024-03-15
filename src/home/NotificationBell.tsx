import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import { useNotifications } from 'src/home/NotificationCenter'
import NotificationBellIcon from 'src/icons/NotificationBellIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

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
    <View style={styles.container}>
      <Touchable
        testID={testID}
        onPress={onPress}
        style={[style, styles.button]}
        borderRadius={Spacing.Thick24}
      >
        <NotificationBellIcon size={size} notificationMark={notificationMark} />
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: Spacing.Small12,
  },
})
