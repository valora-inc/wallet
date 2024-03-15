import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Touchable from 'src/components/Touchable'
import AccountCircle from 'src/icons/AccountCircle'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Spacing } from 'src/styles/styles'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function AccountCircleButton({ style, size, testID }: Props) {
  const onPress = () => {
    navigate(Screens.ProfileMenu)
  }

  return (
    <View testID={testID} style={styles.container}>
      <Touchable onPress={onPress} style={[style, styles.button]} borderRadius={Spacing.Thick24}>
        <AccountCircle size={size} />
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
