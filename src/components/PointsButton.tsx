import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AttentionIcon from 'src/icons/Attention'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButtonV2 } from 'src/navigator/TopBarIconButtonV2'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function PointsButton({ testID, size, style }: Props) {
  const onPress = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_open)
    navigate(Screens.PointsHome)
  }

  return (
    <TopBarIconButtonV2
      icon={<AttentionIcon size={size} />}
      testID={testID}
      onPress={onPress}
      style={style}
    />
  )
}
