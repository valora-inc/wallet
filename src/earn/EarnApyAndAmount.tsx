import BigNumber from 'bignumber.js'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import { getTotalYieldRate } from 'src/earn/poolInfo'
import { EarnPosition } from 'src/positions/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'

export function EarnApyAndAmount({
  tokenAmount,
  pool,
  testIDPrefix = 'Earn',
}: {
  tokenAmount: BigNumber | null
  pool: EarnPosition
  testIDPrefix?: string
}) {
  const { t } = useTranslation()

  const apy = getTotalYieldRate(pool)
  const token = useTokenInfo(pool.dataProps.depositTokenId)

  if (!token) {
    // should never happen
    throw new Error(`Token not found ${pool.dataProps.depositTokenId}`)
  }

  const apyString = apy.toFixed(2)
  const earnUpTo =
    apy && tokenAmount?.gt(0) ? tokenAmount.multipliedBy(apy).dividedBy(100) : new BigNumber(0)

  return (
    <>
      <View style={styles.line}>
        <Text style={styles.label}>{t('earnFlow.enterAmount.earnUpToLabel')}</Text>
        <Text style={styles.label}>{t('earnFlow.enterAmount.rateLabel')}</Text>
      </View>
      <View style={styles.line}>
        <Text style={styles.valuesText} testID={`${testIDPrefix}/EarnApyAndAmount/EarnUpTo`}>
          <Trans i18nKey="earnFlow.enterAmount.earnUpToV1_87">
            <TokenDisplay
              tokenId={token.tokenId}
              amount={earnUpTo}
              showLocalAmount={token.priceUsd !== null}
              showApprox={true}
            />
          </Trans>
        </Text>
        <View style={styles.apy}>
          <TokenIcon token={token} size={IconSize.XSMALL} />

          <Text style={styles.valuesText} testID={`${testIDPrefix}/EarnApyAndAmount/Apy`}>
            {t('earnFlow.enterAmount.rate', {
              rate: apyString,
            })}
          </Text>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  apy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  label: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  line: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.Smallest8,
  },
  valuesText: {
    ...typeScale.labelSemiBoldSmall,
    marginVertical: Spacing.Tiny4,
  },
})
