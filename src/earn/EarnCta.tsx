import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { PROVIDER_ID } from 'src/earn/constants'
import { useAavePoolInfo } from 'src/earn/hooks'
import CircledIcon from 'src/icons/CircledIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'earn/EarnCta'

export default function EarnCta({ depositTokenId }: { depositTokenId: string }) {
  const { t } = useTranslation()
  const depositToken = useTokenInfo(depositTokenId)
  const asyncPoolInfo = useAavePoolInfo({ depositTokenId })

  if (!depositToken) {
    // should never happen
    Logger.error(TAG, `No deposit token found: ${depositTokenId}`)
    return null
  }

  const apyDisplay = asyncPoolInfo.result
    ? new BigNumber(asyncPoolInfo.result.apy).multipliedBy(100).toFixed(2)
    : '--'

  return (
    <View style={styles.container}>
      <Touchable
        borderRadius={8}
        style={styles.touchable}
        onPress={() => {
          ValoraAnalytics.track(EarnEvents.earn_cta_press, {
            depositTokenId,
            providerId: PROVIDER_ID,
            networkId: depositToken.networkId,
          })
          navigate(Screens.EarnInfoScreen, { tokenId: depositTokenId })
        }}
        testID="EarnCta"
      >
        <>
          <Text style={styles.title}>{t('earnFlow.ctaV1_86.title')}</Text>
          <View style={styles.row}>
            <CircledIcon radius={32} backgroundColor={Colors.gray1}>
              <TokenIcon token={depositToken} size={IconSize.SMALL} />
            </CircledIcon>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                {t('earnFlow.ctaV1_86.subtitle', { symbol: depositToken.symbol })}
              </Text>
              <Text style={styles.description}>
                {t('earnFlow.ctaV1_86.description', {
                  apy: apyDisplay,
                  symbol: depositToken.symbol,
                })}
              </Text>
            </View>
          </View>
        </>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.Thick24,
  },
  touchable: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 8,
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
