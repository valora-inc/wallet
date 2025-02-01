import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { demoModeToggled } from 'src/web3/actions'
import { demoModeEnabledSelector, rawWalletAddressSelector } from 'src/web3/selectors'

export default function DemoModeChipIndicator() {
  const demoModeBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const { t } = useTranslation()
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
    <>
      <Touchable
        style={styles.container}
        borderRadius={100}
        onPress={() => {
          demoModeBottomSheetRef.current?.snapToIndex(0)
        }}
      >
        <Text style={styles.text}>{t('demoMode.inAppIndicatorLabel')}</Text>
      </Touchable>
      <BottomSheet
        forwardedRef={demoModeBottomSheetRef}
        title={t('demoMode.confirmExit.title')}
        description={t('demoMode.confirmExit.info')}
      >
        <Button
          onPress={handleExitDemoMode}
          text={t('demoMode.confirmExit.cta')}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          style={styles.demoModeButton}
        />
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.Tiny4,
    paddingHorizontal: Spacing.Small12,
    backgroundColor: colors.accent,
    borderRadius: 100,
  },
  text: {
    ...typeScale.labelXSmall,
    color: colors.contentTertiary,
  },
  demoModeButton: {
    marginTop: Spacing.Thick24,
  },
})
