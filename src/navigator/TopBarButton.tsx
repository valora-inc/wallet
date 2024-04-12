import * as React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native'
import { AnalyticsEventType, AnalyticsPropertiesList } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
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
        ? ValoraAnalytics.track(eventName, eventProperties)
        : ValoraAnalytics.track(eventName)
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
  containerStyle?: ViewStyle
}

/**
 * Please avoid use in new header icons
 * TODO: ACT-1134 alternative component
 * @deprecated
 */
export function TopBarIconButton(props: TopBarIconButtonProps) {
  return <Wrapper {...props}>{props.icon}</Wrapper>
}

export function TopBarIconButtonV2(props: TopBarIconButtonProps) {
  return (
    <Wrapper {...props}>
      <View style={[styles.container, props.containerStyle]}>
        <Touchable
          testID={props.testID}
          onPress={props.onPress}
          style={[styles.button, props.style]}
          borderRadius={Spacing.Thick24}
        >
          {props.icon}
        </Touchable>
      </View>
    </Wrapper>
  )
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
    ...fontStyles.regular,
    color: colors.primary,
  },
  button: {
    padding: Spacing.Small12,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
