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
}

export default function ListItem({ children, onPress, disabled, testID }: Props) {
  return (
    <View style={styles.container}>
      {onPress ? (
        <Touchable onPress={onPress} borderless={true} disabled={disabled} testID={testID}>
          <View style={styles.innerView}>{children}</View>
        </Touchable>
      ) : (
        <View style={styles.innerView}>{children}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light,
  },
  innerView: {
    paddingVertical: variables.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    marginLeft: variables.contentPadding,
  },
})
