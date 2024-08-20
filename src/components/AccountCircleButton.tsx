import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButtonV2 } from 'src/navigator/TopBarIconButtonV2'
import GearIcon from 'src/icons/GearIcon'

interface Props {
  style?: StyleProp<ViewStyle>
  testID?: string
}

export default function AccountCircleButton({ testID, style }: Props) {
  const onPress = () => {
    AppAnalytics.track(HomeEvents.account_circle_tapped)
    navigate(Screens.SettingsMenu)
  }

  return <TopBarIconButtonV2 icon={<GearIcon />} testID={testID} onPress={onPress} style={style} />
}
