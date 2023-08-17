import * as React from 'react'
import { TouchableWithoutFeedbackProps, View } from 'react-native'
import PlatformTouchable from 'react-native-platform-touchable'

export interface Props extends TouchableWithoutFeedbackProps {
  borderless?: boolean
  children: React.ReactNode // must only have one direct child. see https://github.com/react-native-community/react-native-platform-touchable#touchable
  borderRadius?: number
}

/**
 * @param borderless - If true, the touchable has a borderless ripple effect.
 * @param borderRadius - should be added if the touchable component has rounded corners, to prevent the ripple effect from going outside the component on tap (Android)
 * @returns A touchable component
 */
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
