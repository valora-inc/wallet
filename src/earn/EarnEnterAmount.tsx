import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import CustomHeader from 'src/components/header/CustomHeader'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

export default function EarnEnterAmount({ token }: { token: TokenBalance }) {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const onPressContinue = () => {
    // navigate to correct screen / bottom sheet
  }

  const tvl = 150000000
  const rate = 3.33
  const amountEntered = false

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader
        style={{ paddingHorizontal: Spacing.Thick24 }}
        left={<BackButton height={32} />}
      />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.title}>{t('earnFlow.enterAmount.title')}</Text>
          {/* Input box component here */}
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
            <View style={styles.row}>{/* Add info bottom line */}</View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.Thick24,
    paddingTop: Spacing.Thick24,
    flexGrow: 1,
  },
  inputContainer: {
    flex: 1,
  },
  title: {
    ...typeScale.titleSmall,
  },
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
})
