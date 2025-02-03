import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { navigateBack, navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { demoModeToggled } from 'src/web3/actions'
import { rawWalletAddressSelector } from 'src/web3/selectors'

export default function DemoModeAuthBlock() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const originalWalletAddress = useSelector(rawWalletAddressSelector)

  const handleExitDemoMode = () => {
    dispatch(demoModeToggled(false))
    navigateBack() // dismiss the bottom sheet

    if (!originalWalletAddress) {
      navigateClearingStack(Screens.Welcome)
    }
  }

  return (
    <BottomSheetScrollView>
      <Text style={styles.title}>{t('demoMode.restrictedAccess.title')}</Text>
      <Text style={styles.description}>{t('demoMode.restrictedAccess.info')}</Text>
      <Button
        style={styles.demoModeButton}
        onPress={handleExitDemoMode}
        text={t('demoMode.restrictedAccess.cta')}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.FULL}
      />
      <Button
        style={styles.demoModeButton}
        onPress={navigateBack}
        text={t('dismiss')}
        size={BtnSizes.FULL}
      />
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  title: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Regular16,
  },
  description: {
    ...typeScale.bodySmall,
    marginBottom: Spacing.Small12,
  },
  demoModeButton: {
    marginTop: Spacing.Small12,
  },
})
