import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'

interface Props {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  testID?: string
  borderless?: boolean
}

export default function ListItem({ children, onPress, disabled, testID, borderless }: Props) {
  const innerViewStyle = {
    ...styles.innerView,
    borderBottomWidth: borderless ? 0 : 1,
  }

  return (
    <View style={styles.container}>
      {onPress ? (
        <Touchable onPress={onPress} borderless={true} disabled={disabled} testID={testID}>
          <View style={innerViewStyle}>{children}</View>
        </Touchable>
      ) : (
        <View style={innerViewStyle}>{children}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  innerView: {
    paddingVertical: variables.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    marginHorizontal: variables.contentPadding,
  },
})
