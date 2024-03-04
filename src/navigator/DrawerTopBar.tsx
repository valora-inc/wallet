import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Keyboard, StyleSheet, TouchableOpacity, View, processColor } from 'react-native'
import Animated, { cond, greaterThan } from 'react-native-reanimated'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AccountCircle from 'src/icons/AccountCircle'
import Hamburger from 'src/icons/Hamburger'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
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
  const useTabNavigator = getFeatureGate(StatsigFeatureGates.USE_TAB_NAVIGATOR)
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

  const onPressProfile = () => {
    // Dismiss keyboard if it's open
    Keyboard.dismiss()
    vibrateInformative()
    // TODO(act-1107): navigate to new profile / setting screen
    navigate(Screens.Profile)
  }

  return (
    <Animated.View testID={testID} style={viewStyle}>
      <View style={styles.leftElement}>
        <TouchableOpacity
          onPress={useTabNavigator ? onPressProfile : onPressHamburger}
          hitSlop={iconHitslop}
        >
          {useTabNavigator ? <AccountCircle /> : <Hamburger />}
        </TouchableOpacity>
        {leftElement}
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
  leftElement: {
    position: 'absolute',
    left: 0,
    padding: 0,
    marginLeft: 16,
    marginBottom: 0,
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
