import * as React from 'react'
import { TouchableWithoutFeedbackProps, View, ViewStyle } from 'react-native'
import PlatformTouchable from 'react-native-platform-touchable'

type BorderRadiusStyle = Pick<
  ViewStyle,
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomLeftRadius'
  | 'borderBottomRightRadius'
>

export interface Props extends TouchableWithoutFeedbackProps {
  borderless?: boolean
  children: React.ReactNode // must only have one direct child. see https://github.com/react-native-community/react-native-platform-touchable#touchable
  borderRadius?: number | BorderRadiusStyle
  shouldRenderRippleAbove?: boolean
}

/**
 * @param borderless - If true, the touchable has a borderless ripple effect.
 * @param borderRadius - should be added if the touchable component has rounded corners, to prevent the ripple effect from going outside the component on tap (Android). Can either be a number
 *   representing a single border radius, or an object individually specifying each corner's radius.
 * @param shouldRenderRippleAbove - If present, ensures that the ripple effect will render above the touchable component. See https://github.com/facebook/react-native/issues/17200
 * @returns A touchable component
 */
export default function Touchable({
  shouldRenderRippleAbove,
  borderless,
  borderRadius = 0,
  ...passThroughProps
}: Props) {
  const background = borderless
    ? PlatformTouchable.SelectableBackgroundBorderless()
    : PlatformTouchable.SelectableBackground()
  const borderStyle = typeof borderRadius === 'number' ? { borderRadius } : borderRadius
  return borderRadius === 0 ? (
    <PlatformTouchable {...passThroughProps} background={background} />
  ) : (
    <View style={[borderStyle, !borderless && { overflow: 'hidden' }]}>
      <PlatformTouchable
        {...passThroughProps}
        background={shouldRenderRippleAbove ? undefined : background}
        foreground={shouldRenderRippleAbove ? background : undefined}
      />
    </View>
  )
}
