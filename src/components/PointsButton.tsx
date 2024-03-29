import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AttentionIcon from 'src/icons/Attention'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function PointsButton({ style, size, testID }: Props) {
  const onPress = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_open)
    navigate(Screens.PointsHome)
  }

  return (
    <TopBarIconButton
      testID={testID}
      icon={<AttentionIcon size={size} />}
      onPress={onPress}
      style={style}
    />
  )
}
