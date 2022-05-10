import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { CELO_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { Spacing } from 'src/styles/styles'

interface Props {
  onPressWithdraw: () => void
}

// Actions container for CP-DOTO restricted countries
export default function RestrictedCeloExchange({ onPressWithdraw }: Props) {
  const { t } = useTranslation()

  const celoBalance = useSelector(celoTokenBalanceSelector)

  const hasCelo = new BigNumber(celoBalance || 0).isGreaterThan(CELO_TRANSACTION_MIN_AMOUNT)

  if (!hasCelo) {
    return <View style={styles.emptyContainer} />
  }

  return (
    <Button
      size={BtnSizes.FULL}
      text={t('withdrawCelo')}
      onPress={onPressWithdraw}
      style={styles.button}
      type={BtnTypes.TERTIARY}
      testID="WithdrawCELO"
    />
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    marginTop: Spacing.Thick24,
  },
  button: {
    marginTop: Spacing.Thick24,
    marginBottom: Spacing.Regular16,
    marginHorizontal: Spacing.Regular16,
  },
})
