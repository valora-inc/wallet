import React from 'react'
import { StyleSheet, Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { demoModeToggled } from 'src/app/actions'
import { demoModeEnabledSelector } from 'src/app/selectors'
import Touchable from 'src/components/Touchable'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { rawWalletAddressSelector } from 'src/web3/selectors'

export default function DemoModeChipIndicator() {
  const dispatch = useDispatch()
  const demoModeEnabled = useSelector(demoModeEnabledSelector)
  const originalWalletAddress = useSelector(rawWalletAddressSelector)

  const handleExitDemoMode = () => {
    dispatch(demoModeToggled(false))
    if (!originalWalletAddress) {
      navigateClearingStack(Screens.Welcome)
    }
  }

  if (!demoModeEnabled) {
    return null
  }

  return (
    <LinearGradient
      colors={[Colors.brandGradientLeft, Colors.brandGradientRight]}
      locations={[0, 0.8915]}
      useAngle={true}
      angle={90}
      style={styles.background}
    >
      <Touchable style={styles.container} onPress={handleExitDemoMode}>
        <Text style={styles.text}>Demo Mode</Text>
      </Touchable>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  background: {
    borderRadius: 100,
  },
  container: {
    paddingVertical: Spacing.Tiny4,
    paddingHorizontal: Spacing.Small12,
    margin: 1, // to show the gradient border
    backgroundColor: Colors.backgroundPrimary,
    opacity: 0.9,
    borderRadius: 100,
  },
  text: {
    ...typeScale.labelXSmall,
  },
})
