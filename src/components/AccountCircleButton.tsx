import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AccountCircle from 'src/icons/AccountCircle'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButtonV2 } from 'src/navigator/TopBarIconButtonV2'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function AccountCircleButton({ testID, size, style }: Props) {
  const onPress = () => {
    ValoraAnalytics.track(HomeEvents.account_circle_tapped)
    navigate(Screens.ProfileMenu)
  }

  return (
    <TopBarIconButtonV2
      icon={<AccountCircle size={size} />}
      testID={testID}
      onPress={onPress}
      style={style}
    />
  )
}
