import * as React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native'
import { AnalyticsEventType, AnalyticsPropertiesList } from 'src/analytics/Properties'
import AppAnalytics from 'src/analytics/AppAnalytics'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import variables from 'src/styles/variables'

interface CommonProps {
  disabled?: boolean
  testID?: string
  onPress: () => void
  eventName?: AnalyticsEventType
  eventProperties?: AnalyticsPropertiesList[AnalyticsEventType]
  style?: StyleProp<ViewStyle>
}

type WrapperProps = CommonProps & {
  children: JSX.Element
}

function Wrapper({
  eventName,
  onPress,
  disabled,
  testID,
  children,
  style,
  eventProperties,
}: WrapperProps) {
  const onPressLocal = React.useCallback(() => {
    if (eventName) {
      eventProperties
        ? AppAnalytics.track(eventName, eventProperties)
        : AppAnalytics.track(eventName)
    }
    onPress()
  }, [onPress, eventName])

  return (
    <Touchable
      disabled={disabled}
      testID={testID}
      onPress={onPressLocal}
      borderless={true}
      hitSlop={variables.iconHitslop}
      style={style}
    >
      {children}
    </Touchable>
  )
}

export type TopBarIconButtonProps = CommonProps & {
  icon: JSX.Element
}

/**
 * Please avoid use in new header icons - use TopBarIconButtonV2 instead
 * @deprecated
 */
export function TopBarIconButton(props: TopBarIconButtonProps) {
  return <Wrapper {...props}>{props.icon}</Wrapper>
}

export type TopBarTextButtonProps = CommonProps & {
  title: string
  titleStyle?: StyleProp<TextStyle>
}

export function TopBarTextButton(props: TopBarTextButtonProps) {
  const { titleStyle, title } = props
  return (
    <Wrapper {...props}>
      <Text style={titleStyle ? [styles.text, titleStyle] : styles.text}>{title}</Text>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  text: {
    ...typeScale.bodyMedium,
    color: colors.primary,
  },
})
