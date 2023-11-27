import React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'
import colors from 'src/styles/colors'
import { Shadow, getShadowStyle } from 'src/styles/styles'

export interface Props extends ViewProps {
  rounded?: boolean
  shadow?: Shadow | null
  children?: React.ReactNode
}

export default function Card({ style, rounded = false, shadow = Shadow.Soft, ...props }: Props) {
  return (
    <View
      style={[
        styles.container,
        rounded && styles.rounded,
        shadow ? getShadowStyle(shadow) : undefined,
        style,
      ]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 16,
  },
  rounded: {
    borderRadius: 8,
  },
})
