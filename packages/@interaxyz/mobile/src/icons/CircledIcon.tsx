import * as React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'

interface Props {
  backgroundColor?: colors
  radius?: number
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
  borderColor?: colors
}

export default function CircledIcon({
  backgroundColor = colors.accent,
  radius = 50,
  borderColor,
  style,
  children,
}: Props) {
  return (
    <View
      style={[
        {
          backgroundColor,
          height: radius,
          width: radius,
          borderRadius: radius,
        },
        borderColor && {
          borderColor,
          borderWidth: 1,
        },
        styles.container,
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
