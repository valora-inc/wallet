import React from 'react'
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { styles as headerStyles } from 'src/navigator/Headers'

interface Props {
  left?: React.ReactNode
  right?: React.ReactNode
  title?: React.ReactNode | string
  style?: StyleProp<ViewStyle>
}

function CustomHeader({ left, right, title, style }: Props) {
  const titleComponent =
    typeof title === 'string' ? (
      <Text testID="CustomHeaderTitle" style={headerStyles.headerTitle}>
        {title}
      </Text>
    ) : (
      title
    )
  return (
    <View style={style ? [styles.container, style] : styles.container}>
      {!!title && <View style={styles.titleContainer}>{titleComponent}</View>}
      {/* Need left element to be an empty view if not provided for right alignment to work */}
      {left ? <View style={styles.buttonContainer}>{left}</View> : <View />}
      {!!right && <View style={styles.buttonContainer}>{right}</View>}
    </View>
  )
}

export const CUSTOM_HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56

const styles = StyleSheet.create({
  container: {
    height: CUSTOM_HEADER_HEIGHT,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0,
  },
})

export default CustomHeader
