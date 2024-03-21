import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Touchable from 'src/components/Touchable'
import X from 'src/icons/X'
import { navigateBack } from 'src/navigator/NavigationService'
import { Spacing } from 'src/styles/styles'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function CloseButton({ style, size, testID }: Props) {
  const onPress = () => {
    navigateBack()
  }

  return (
    <View style={styles.container}>
      <Touchable
        testID={testID}
        onPress={onPress}
        style={[style, styles.button]}
        borderRadius={Spacing.Thick24}
      >
        <X size={size} />
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: Spacing.Small12,
  },
})
