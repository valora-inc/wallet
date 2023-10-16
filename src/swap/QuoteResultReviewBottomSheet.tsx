import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import AttentionIcon from 'src/icons/Attention'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import {
  QuoteResult,
  QuoteResultNeedDecreaseSwapAmountForGas,
  QuoteResultNotEnoughBalanceForGas,
} from 'src/swap/useSwapQuote'

export default function QuoteResultReviewBottomSheet({
  forwardedRef,
  quote,
  onAcceptDecreaseSwapAmountForGas,
}: {
  forwardedRef: React.RefObject<BottomSheetRefType>
  quote: QuoteResult
  onAcceptDecreaseSwapAmountForGas: () => void
}) {
  const quoteType = quote.type
  switch (quoteType) {
    case 'need-decrease-swap-amount-for-gas':
      return (
        <QuoteResultNeedDecreaseSwapAmountForGasBottomSheet
          forwardedRef={forwardedRef}
          quote={quote}
          onAcceptDecreaseSwapAmountForGas={onAcceptDecreaseSwapAmountForGas}
        />
      )
    case 'not-enough-balance-for-gas':
      return (
        <QuoteResultNotEnoughBalanceForGasBottomSheet forwardedRef={forwardedRef} quote={quote} />
      )
    case 'possible':
      return null
    default:
      // To catch any missing cases at compile time
      const assertNever: never = quoteType
      return assertNever
  }
}

function QuoteResultNeedDecreaseSwapAmountForGasBottomSheet({
  forwardedRef,
  quote,
  onAcceptDecreaseSwapAmountForGas,
}: {
  forwardedRef: React.RefObject<BottomSheetRefType>
  quote: QuoteResultNeedDecreaseSwapAmountForGas
  onAcceptDecreaseSwapAmountForGas: () => void
}) {
  const { t } = useTranslation()

  const tokenSymbol = quote.feeCurrency.symbol

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('swapScreen.needDecreaseSwapAmountForGas.title', { tokenSymbol })}
      testId="QuoteResultNeedDecreaseSwapAmountForGasBottomSheet"
    >
      <View style={styles.container}>
        <AttentionIcon />
        <Text style={styles.warningText}>
          {t('swapScreen.needDecreaseSwapAmountForGas.description', { tokenSymbol })}
        </Text>
      </View>
      <Button
        text={t('swapScreen.needDecreaseSwapAmountForGas.confirmDecreaseButton', { tokenSymbol })}
        onPress={onAcceptDecreaseSwapAmountForGas}
        size={BtnSizes.FULL}
        type={BtnTypes.PRIMARY}
        testID="QuoteResultNeedDecreaseSwapAmountForGasBottomSheet/PrimaryAction"
      />
    </BottomSheet>
  )
}

function QuoteResultNotEnoughBalanceForGasBottomSheet({
  forwardedRef,
  quote,
}: {
  forwardedRef: React.RefObject<BottomSheetRefType>
  quote: QuoteResultNotEnoughBalanceForGas
}) {
  const { t } = useTranslation()

  const feeCurrencies = quote.feeCurrencies.map((feeCurrency) => feeCurrency.symbol).join(', ')

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('swapScreen.notEnoughBalanceForGas.title', { feeCurrencies })}
      testId="QuoteResultNotEnoughBalanceForGasBottomSheet"
    >
      <View style={styles.container}>
        <AttentionIcon />
        <Text style={styles.warningText}>
          {t('swapScreen.notEnoughBalanceForGas.description', { feeCurrencies })}
        </Text>
      </View>
      <Button
        text={t('swapScreen.notEnoughBalanceForGas.dismissButton', { feeCurrencies })}
        onPress={() => forwardedRef.current?.close()}
        size={BtnSizes.FULL}
        type={BtnTypes.SECONDARY}
        testID="QuoteResultNotEnoughBalanceForGasBottomSheet/PrimaryAction"
      />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.yellowFaint,
    borderRadius: 4,
    marginTop: Spacing.Regular16,
    marginBottom: Spacing.Thick24,
    padding: Spacing.Regular16,
  },
  warningText: {
    ...fontStyles.xsmall,
    flex: 1,
    flexWrap: 'wrap',
    marginLeft: Spacing.Small12,
  },
})
