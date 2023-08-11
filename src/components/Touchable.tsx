import * as React from 'react'
import { TouchableWithoutFeedbackProps, View } from 'react-native'
import PlatformTouchable from 'react-native-platform-touchable'

export interface Props extends TouchableWithoutFeedbackProps {
  borderless?: boolean
  children: React.ReactNode // must only have one direct child. see https://github.com/react-native-community/react-native-platform-touchable#touchable
  borderRadius?: number
}

export default function Touchable({ borderless, borderRadius = 0, ...passThroughProps }: Props) {
  const background = borderless
    ? PlatformTouchable.SelectableBackgroundBorderless()
    : PlatformTouchable.SelectableBackground()
  return borderRadius === 0 ? (
    <PlatformTouchable {...passThroughProps} background={background} />
  ) : (
    <View style={[{ borderRadius }, !borderless && { overflow: 'hidden' }]}>
      <PlatformTouchable {...passThroughProps} background={background} />
    </View>
  )
}
