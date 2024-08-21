import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import Colors from 'src/styles/colors'

const SvgComponent = (props: { height: number; width: number; testID?: string }) => (
  <View testID={props.testID} style={styles.container}>
    <Svg width={props.width} height={props.height} fill="none">
      <Path fill="url(#a)" d={`M0 0h${props.width}v${props.height}H0z`} />
      <Defs>
        <LinearGradient id="a" x1={0} y1={0} x2={0} y2={1000} gradientUnits="userSpaceOnUse">
          <Stop stopColor={Colors.white} />
          <Stop offset={1} stopColor={Colors.white} stopOpacity={0} />
        </LinearGradient>
      </Defs>
    </Svg>
  </View>
)

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
})

export default SvgComponent
