import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes } from 'src/components/Button'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import InfoIcon from 'src/icons/InfoIcon'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { TokenBalance } from 'src/tokens/slice'

export default function EarnEnterAmount({ token }: { token: TokenBalance }) {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const infoBottomSheetRef = useRef<BottomSheetRefType>(null)

  const onPressContinue = () => {
    // navigate to correct screen / bottom sheet
  }

  const onPressInfo = () => {
    infoBottomSheetRef.current?.snapToIndex(0)
  }

  const onPressDismiss = () => {
    infoBottomSheetRef.current?.close()
  }

  const tvl = 150000000
  const rate = 3.33
  const amountEntered = false

  return (
    <View style={styles.infoContainer}>
      <View style={styles.line}>
        <Text style={styles.label}>{t('earnFlow.enterAmount.tvl')}</Text>
        <Text style={styles.label}>{t('earnFlow.enterAmount.rate')}</Text>
      </View>
      <View style={styles.line}>
        <Text>
          {localCurrencySymbol}
          {tvl}
        </Text>
        <View style={styles.row}>
          <TokenIcon token={token} size={IconSize.SMALL} />
          <Text>{t('earnFlow.enterAmount.rate', { rate })}</Text>
        </View>
      </View>
      <Button
        onPress={onPressContinue}
        text={t('earnFlow.enterAmount.continue')}
        style={styles.continueButton}
        size={BtnSizes.FULL}
        fontStyle={styles.continueButtonText}
        disabled={!amountEntered}
      />
      <View style={styles.row}>
        <Text style={styles.infoText}>{t('earnFlow.enterAmount.info')}</Text>
        <TouchableOpacity
          onPress={onPressInfo}
          hitSlop={variables.iconHitslop}
          testID="AssetsTokenBalance/Info"
        >
          <InfoIcon color={Colors.black} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  infoContainer: {
    padding: Spacing.Regular16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray2,
  },
  line: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.Smallest8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  continueButton: {
    paddingVertical: Spacing.Thick24,
  },
  continueButtonText: {
    ...typeScale.labelSemiBoldMedium,
  },
  infoText: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
})
