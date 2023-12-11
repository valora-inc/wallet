import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Keyboard, StyleSheet, TouchableOpacity, View, processColor } from 'react-native'
import Animated, { cond, greaterThan } from 'react-native-reanimated'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Hamburger from 'src/icons/Hamburger'
import colors from 'src/styles/colors'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
import { iconHitslop } from 'src/styles/variables'

interface Props {
  leftElement?: React.ReactNode
  middleElement?: React.ReactNode
  rightElement?: React.ReactNode
  scrollPosition?: Animated.Value<number>
  testID?: string
}

function DrawerTopBar({ leftElement, middleElement, rightElement, scrollPosition, testID }: Props) {
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
    // Dismiss keyboard if it's open
    Keyboard.dismiss()
    ValoraAnalytics.track(HomeEvents.hamburger_tapped)
    vibrateInformative()
    // @ts-ignore Only used in a drawer
    return navigation.toggleDrawer()
  }

  return (
    <Animated.View testID={testID} style={viewStyle}>
      <View style={styles.hamburger}>
        <View style={styles.leftElement}>
          <TouchableOpacity onPress={onPressHamburger} hitSlop={iconHitslop}>
            <Hamburger />
          </TouchableOpacity>
          {leftElement}
        </View>
      </View>
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
  leftElement: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.Thick24,
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
