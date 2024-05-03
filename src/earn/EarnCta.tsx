import React from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { getAavePoolInfo } from 'src/earn/poolInfo'
import EarnAave from 'src/icons/EarnAave'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { Address } from 'viem'

const USDC_AMOUNT = 10
const TAG = 'earn/EarnCta'

export default function EarnCta() {
  const { t } = useTranslation()
  const token = useTokenInfo(networkConfig.arbUsdcTokenId)

  const asyncPoolInfo = useAsync(async () => {
    if (!token) {
      Logger.warn(TAG, `Token with id ${networkConfig.arbUsdcTokenId} not found`)
      throw new Error('Token not found')
    }
    return getAavePoolInfo(token.address as Address)
  }, [])

  return (
    <Touchable
      borderRadius={8}
      style={styles.touchable}
      onPress={() => {
        ValoraAnalytics.track(EarnEvents.earn_cta_press)
      }}
      testID="EarnCta"
    >
      <>
        <Text style={styles.title}>{t('earnStablecoin.title')}</Text>
        <View style={styles.row}>
          <EarnAave />
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>{t('earnStablecoin.subtitle')}</Text>
            {asyncPoolInfo.result && (
              <Text style={styles.description} testID="EarnCta/Description">
                <Trans i18nKey="earnStablecoin.description">
                  <TokenDisplay
                    amount={USDC_AMOUNT}
                    tokenId={networkConfig.arbUsdcTokenId}
                    showLocalAmount={false}
                  />
                  <TokenDisplay
                    amount={USDC_AMOUNT * asyncPoolInfo.result.apy}
                    tokenId={networkConfig.arbUsdcTokenId}
                  />
                </Trans>
              </Text>
            )}
          </View>
        </View>
      </>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  touchable: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  row: {
    flexDirection: 'row',
    marginTop: 20,
    gap: Spacing.Smallest8,
  },
  subtitleContainer: {
    flex: 1,
  },
  subtitle: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.black,
  },
  description: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
})
