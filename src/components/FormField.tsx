import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import FormLabel from 'src/components/FormLabel'

interface Props {
  style?: StyleProp<ViewStyle>
  label?: string
  children?: React.ReactNode
}

// A form field with a label and children
export default function FormField({ style, label, children }: Props) {
  return (
    <View style={style}>
      <FormLabel style={styles.label}>{label}</FormLabel>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { marginBottom: 8 },
})
