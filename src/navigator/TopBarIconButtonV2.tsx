import * as React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { AnalyticsEventType, AnalyticsPropertiesList } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
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
      onPress={onPressLocal}
      borderless={true}
      hitSlop={variables.iconHitslop}
      style={style}
    >
      {children}
    </Touchable>
  )
}

type TopBarIconButtonV2Props = CommonProps & {
  icon: JSX.Element
  containerStyle?: ViewStyle
  size?: number
}

export function TopBarIconButtonV2(props: TopBarIconButtonV2Props) {
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

const styles = StyleSheet.create({
  button: {
    padding: Spacing.Small12,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
