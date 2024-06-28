import BigNumber from 'bignumber.js'
import React, { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import { poolInfoFetchStatusSelector, poolInfoSelector } from 'src/earn/selectors'
import { fetchPoolInfo } from 'src/earn/slice'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

export function EarnApyAndAmount({
  tokenAmount,
  token,
  testIDPrefix = 'Earn',
}: {
  tokenAmount: BigNumber | null
  token: TokenBalance
  testIDPrefix?: string
}) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const poolInfo = useSelector(poolInfoSelector)
  const poolInfoFetchStatus = useSelector(poolInfoFetchStatusSelector)

  useEffect(() => {
    dispatch(fetchPoolInfo())
  }, [])

  const apy = poolInfo?.apy

  const apyString = apy ? (apy * 100).toFixed(2) : '--'
  const earnUpTo =
    apy && tokenAmount?.gt(0) ? tokenAmount.multipliedBy(new BigNumber(apy)) : new BigNumber(0)

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

          {poolInfoFetchStatus === 'loading' ? (
            <SkeletonPlaceholder
              backgroundColor={Colors.gray2}
              highlightColor={Colors.white}
              testID={`${testIDPrefix}/EarnApyAndAmount/Apy/Loading`}
            >
              <View style={styles.loadingSkeleton} />
            </SkeletonPlaceholder>
          ) : (
            <Text style={styles.valuesText} testID={`${testIDPrefix}/EarnApyAndAmount/Apy`}>
              {t('earnFlow.enterAmount.rate', {
                rate: apyString,
              })}
            </Text>
          )}
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
  loadingSkeleton: {
    ...typeScale.labelSemiBoldSmall,
    marginVertical: Spacing.Smallest8,
    width: 100,
    borderRadius: 100,
  },
})
