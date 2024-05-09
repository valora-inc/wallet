import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import InfoIcon from 'src/icons/InfoIcon'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import { ProceedComponentProps } from 'src/send/EnterAmount'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

export default function EarnEnterAmount({ tokenAmount, token, disabled }: ProceedComponentProps) {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const infoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const addCryptoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const reviewBottomSheetRef = useRef<BottomSheetRefType>(null)

  const onPressContinue = () => {
    tokenAmount?.gt(token.balance)
      ? addCryptoBottomSheetRef.current?.snapToIndex(0)
      : reviewBottomSheetRef.current?.snapToIndex(0)
  }

  const onPressInfo = () => {
    infoBottomSheetRef.current?.snapToIndex(0)
  }

  const tvl = 150000000 // TODO: Replace with actual TVL
  const rate = 3.33 // TODO: Replace with actual rate

  return (
    <View>
      <View style={styles.infoContainer}>
        <View style={styles.line}>
          <Text style={styles.label}>{t('earnFlow.enterAmount.tvlLabel')}</Text>
          <Text style={styles.label}>{t('earnFlow.enterAmount.rateLabel')}</Text>
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
          fontStyle={styles.buttonText}
          disabled={disabled}
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
      <InfoBottomSheet infoBottomSheetRef={infoBottomSheetRef} />
      {/* AddCryptoBottomSheet */}
      {/* ReviewBottomSheet */}
    </View>
  )
}

function InfoBottomSheet({
  infoBottomSheetRef,
}: {
  infoBottomSheetRef: React.RefObject<BottomSheetRefType>
}) {
  const { t } = useTranslation()
  const onPressDismiss = () => {
    infoBottomSheetRef.current?.close()
  }

  return (
    <BottomSheet
      forwardedRef={infoBottomSheetRef}
      title={t('earnFlow.enterAmount.infoBottomSheet.title')}
      description={t('earnFlow.enterAmount.infoBottomSheet.description')}
      testId={'Earn/EnterAmount/InfoBottomSheet'}
      titleStyle={styles.infoTitle}
    >
      <Button
        onPress={onPressDismiss}
        text={t('earnFlow.enterAmount.infoBottomSheet.dismiss')}
        size={BtnSizes.FULL}
        type={BtnTypes.GRAY_WITH_BORDER}
        fontStyle={styles.buttonText}
      />
    </BottomSheet>
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
  buttonText: {
    ...typeScale.labelSemiBoldMedium,
  },
  infoText: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
  infoTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
})
