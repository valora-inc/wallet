import * as React from 'react'
import { TouchableWithoutFeedbackProps, View, ViewStyle } from 'react-native'
import PlatformTouchable from 'react-native-platform-touchable'

export interface Props extends TouchableWithoutFeedbackProps {
  borderless?: boolean
  children: React.ReactNode // must only have one direct child. see https://github.com/react-native-community/react-native-platform-touchable#touchable
  borderRadius?: number
  touchableStyle?: ViewStyle
  useForeground?: boolean
}

/**
 * @param borderless - If true, the touchable has a borderless ripple effect.
 * @param borderRadius - should be added if the touchable component has rounded corners, to prevent the ripple effect from going outside the component on tap (Android)
 * @param useForeground - If present, will set foreground parameter instead of background. Helps with z-index issues within absolutely-positioned parents. See https://github.com/facebook/react-native/issues/17200
 * @param touchableStyle - If present, will set the style on the Touchable wrapper. Used to override borderRadius in case of atypical borders.
 * @returns A touchable component
 */
export default function Touchable({
  touchableStyle,
  useForeground,
  borderless,
  borderRadius = 0,
  ...passThroughProps
}: Props) {
  const background = borderless
    ? PlatformTouchable.SelectableBackgroundBorderless()
    : PlatformTouchable.SelectableBackground()
  return borderRadius === 0 ? (
    <PlatformTouchable {...passThroughProps} background={background} />
  ) : (
    <View style={[{ borderRadius }, touchableStyle, !borderless && { overflow: 'hidden' }]}>
      <PlatformTouchable
        {...passThroughProps}
        background={useForeground ? undefined : background}
        foreground={useForeground ? background : undefined}
      />
    </View>
  )
}
