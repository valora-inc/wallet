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
}

/**
 * Please avoid use in new header icons
 * TODO: ACT-1134 alternative component
 * @deprecated
 */
export function TopBarIconButton(props: TopBarIconButtonProps) {
  return <Wrapper {...props}>{props.icon}</Wrapper>
}

export function TopBarIconButtonV2({ testID, onPress, style, icon }: TopBarIconButtonProps) {
  // Define a fixed size for the button
  const buttonSize = 48 // Example size, adjust as needed
  const borderRadius = buttonSize / 2 // This will make it perfectly circular
  console.log('style CK', style) // Inside TopBarIconButtonV2
  return (
    <View style={styles.container}>
      <Touchable
        testID={testID}
        onPress={onPress}
        // style={[style, styles.button]}
        style={[
          style,
          styles.button,
          // { height: buttonSize, width: buttonSize, borderRadius: borderRadius },
        ]}
        borderRadius={Spacing.Thick24}
      >
        {icon}
      </Touchable>
    </View>
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
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: Spacing.Regular16,
  },
})
