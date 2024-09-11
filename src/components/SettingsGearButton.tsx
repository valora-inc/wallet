import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import GearIcon from 'src/icons/GearIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButtonV2 } from 'src/navigator/TopBarIconButtonV2'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function SettingsGearButton({ testID, size, style }: Props) {
  const onPress = () => {
    AppAnalytics.track(HomeEvents.account_circle_tapped)
    navigate(Screens.SettingsMenu)
  }

  return (
    <TopBarIconButtonV2
      icon={<GearIcon size={size} />}
      testID={testID}
      onPress={onPress}
      style={style}
    />
  )
}
