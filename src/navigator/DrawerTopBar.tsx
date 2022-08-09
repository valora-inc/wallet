import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { processColor, StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { cond, greaterThan } from 'react-native-reanimated'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Hamburger from 'src/icons/Hamburger'
import colors from 'src/styles/colors'
import { iconHitslop } from 'src/styles/variables'

interface Props {
  middleElement?: React.ReactNode
  rightElement?: React.ReactNode
  scrollPosition?: Animated.Value<number>
  style?: any
  testID?: string
}

function DrawerTopBar({ style, middleElement, rightElement, scrollPosition, testID }: Props) {
  const navigation = useNavigation()
  const viewStyle = React.useMemo(
    () => ({
      ...styles.container,
      borderBottomWidth: 1,
      borderBottomColor: cond(
        greaterThan(scrollPosition ?? new Animated.Value(0), 0),
        // TODO: fix type
        processColor(colors.gray2) as any,
        processColor('transparent') as any
      ) as any,
    }),
    [scrollPosition]
  )

  const onPressHamburger = () => {
    ValoraAnalytics.track(HomeEvents.hamburger_tapped)
    // @ts-ignore Only used in a drawer
    return navigation.toggleDrawer()
  }

  return (
    <Animated.View testID={testID} style={viewStyle}>
      <TouchableOpacity
        style={style ? [style, styles.hamburger] : styles.hamburger}
        onPress={onPressHamburger}
        hitSlop={iconHitslop}
      >
        <Hamburger />
      </TouchableOpacity>
      {middleElement}
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </Animated.View>
  )
}

DrawerTopBar.defaultProps = {
  showLogo: true,
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  hamburger: {
    position: 'absolute',
    left: 0,
    padding: 0,
    marginLeft: 16,
    marginBottom: 0,
  },
  rightElement: {
    position: 'absolute',
    right: 0,
    padding: 0,
    marginRight: 16,
    marginBottom: 0,
  },
})

export default DrawerTopBar
