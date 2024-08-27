import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { Line, Svg } from 'react-native-svg'
import { default as Colors, default as colors } from 'src/styles/colors'
import { elevationShadowStyle } from 'src/styles/styles'

function HamburgerCard() {
  return (
    <View style={styles.container}>
      <Svg testID="Hamburger" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <Line
          x1="7.25"
          y1="9.75"
          x2="24.75"
          y2="9.75"
          stroke={Colors.black}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Line
          x1="7.25"
          y1="15.75"
          x2="24.75"
          y2="15.75"
          stroke={Colors.black}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Line
          x1="7.25"
          y1="21.75"
          x2="24.75"
          y2="21.75"
          stroke={Colors.black}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    ...elevationShadowStyle(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    height: 32,
    width: 32,
  },
})

export default React.memo(HamburgerCard)
