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
  PreparedTransactionsNeedDecreaseSpendAmountForGas,
  PreparedTransactionsNotEnoughBalanceForGas,
  PreparedTransactionsResult,
} from 'src/viem/prepareTransactions'

export default function PreparedTransactionsReviewBottomSheet({
  forwardedRef,
  preparedTransactions,
  onAcceptDecreaseSwapAmountForGas,
}: {
  forwardedRef: React.RefObject<BottomSheetRefType>
  preparedTransactions: PreparedTransactionsResult
  onAcceptDecreaseSwapAmountForGas: (
    quote: PreparedTransactionsNeedDecreaseSpendAmountForGas
  ) => void
}) {
  const resultType = preparedTransactions.type
  switch (resultType) {
    case 'need-decrease-spend-amount-for-gas':
      return (
        <PreparedTransactionsNeedDecreaseSwapAmountForGasBottomSheet
          forwardedRef={forwardedRef}
          preparedTransactions={preparedTransactions}
          onAcceptDecreaseSwapAmountForGas={onAcceptDecreaseSwapAmountForGas}
        />
      )
    case 'not-enough-balance-for-gas':
      return (
        <PreparedTransactionsNotEnoughBalanceForGasBottomSheet
          forwardedRef={forwardedRef}
          preparedTransactions={preparedTransactions}
        />
      )
    case 'possible':
      return null
    default:
      // To catch any missing cases at compile time
      const assertNever: never = resultType
      return assertNever
  }
}

function PreparedTransactionsNeedDecreaseSwapAmountForGasBottomSheet({
  forwardedRef,
  preparedTransactions,
  onAcceptDecreaseSwapAmountForGas,
}: {
  forwardedRef: React.RefObject<BottomSheetRefType>
  preparedTransactions: PreparedTransactionsNeedDecreaseSpendAmountForGas
  onAcceptDecreaseSwapAmountForGas: (
    quote: PreparedTransactionsNeedDecreaseSpendAmountForGas
  ) => void
}) {
  const { t } = useTranslation()

  const tokenSymbol = preparedTransactions.feeCurrency.symbol

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
        onPress={() => onAcceptDecreaseSwapAmountForGas(preparedTransactions)}
        size={BtnSizes.FULL}
        type={BtnTypes.PRIMARY}
        testID="QuoteResultNeedDecreaseSwapAmountForGasBottomSheet/PrimaryAction"
      />
    </BottomSheet>
  )
}

function PreparedTransactionsNotEnoughBalanceForGasBottomSheet({
  forwardedRef,
  preparedTransactions,
}: {
  forwardedRef: React.RefObject<BottomSheetRefType>
  preparedTransactions: PreparedTransactionsNotEnoughBalanceForGas
}) {
  const { t } = useTranslation()

  const feeCurrencies = preparedTransactions.feeCurrencies
    .map((feeCurrency) => feeCurrency.symbol)
    .join(', ')

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
