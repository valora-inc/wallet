import React from 'react'
import { StyleSheet, View } from 'react-native'

interface Props {
  left?: React.ReactNode
  right?: React.ReactNode
  title?: React.ReactNode | string
}

function CustomHeader({ left, right, title }: Props) {
  return (
    <View style={styles.container}>
      {left && left}
      {title && <View style={styles.titleContainer}>{title}</View>}
      {right && right}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    position: 'absolute',
    left: 48,
    right: 48,
  },
})

export default CustomHeader
