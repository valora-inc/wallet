import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import AccountCircle from 'src/icons/AccountCircle'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Spacing } from 'src/styles/styles'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function AccountCircleButton({ style, size, testID }: Props) {
  const onPress = () => {
    ValoraAnalytics.track(HomeEvents.account_circle_tapped)
    navigate(Screens.ProfileMenu)
  }

  return (
    <View style={styles.container}>
      <Touchable
        testID={testID}
        onPress={onPress}
        style={[style, styles.button]}
        borderRadius={Spacing.Thick24}
      >
        <AccountCircle size={size} />
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
