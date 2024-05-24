import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import TokenDisplay from 'src/components/TokenDisplay'
import { PROVIDER_ID } from 'src/earn/constants'
import { useAavePoolInfo } from 'src/earn/hooks'
import UpwardGraph from 'src/icons/UpwardGraph'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'earn/EarnActivePool'

function PoolDetailsLoading() {
  return (
    <View>
      <SkeletonPlaceholder backgroundColor={Colors.gray2} highlightColor={Colors.white}>
        <View
          style={{
            ...typeScale.labelXSmall,
            width: 64,
            borderRadius: 100,
          }}
        />
      </SkeletonPlaceholder>
    </View>
  )
}

interface Props {
  cta: 'ExitAndDeposit' | 'ViewPools'
  depositTokenId: string
  poolTokenId: string
}

export default function EarnActivePool({ depositTokenId, poolTokenId, cta }: Props) {
  const { t } = useTranslation()
  const poolToken = useTokenInfo(poolTokenId)
  const asyncPoolInfo = useAavePoolInfo({ depositTokenId })

  if (!poolToken) {
    // should never happen
    Logger.error(TAG, `No pool token found ${poolTokenId}`)
    return null
  }

  return (
    <View style={styles.card} testID="EarnActivePool">
      <View style={styles.container}>
        <Text style={styles.title}>{t('earnFlow.activePools.title')}</Text>
        <View>
          <View style={styles.row}>
            <Text style={styles.totalValueText}>{t('earnFlow.activePools.totalValue')}</Text>
            {poolToken.balance && (
              <TokenDisplay
                amount={poolToken.balance}
                showLocalAmount={false}
                testID={`${depositTokenId}-totalAmount`}
                tokenId={depositTokenId}
              />
            )}
          </View>
          <View style={styles.row}>
            {asyncPoolInfo.error && <View />}
            {asyncPoolInfo.loading && <PoolDetailsLoading />}
            {asyncPoolInfo.result && !!asyncPoolInfo.result.apy && (
              <View style={styles.apyContainer}>
                <Text style={styles.apyText}>
                  {t('earnFlow.activePools.apy', {
                    apy: (asyncPoolInfo.result.apy * 100).toFixed(2),
                  })}
                </Text>
                <UpwardGraph />
              </View>
            )}
            {poolToken.balance && (
              <TokenDisplay
                amount={poolToken.balance}
                showLocalAmount={true}
                testID={`${depositTokenId}-totalAmount`}
                tokenId={depositTokenId}
              />
            )}
          </View>
        </View>
        {cta === 'ExitAndDeposit' && (
          <View style={styles.buttonContainer}>
            <Button
              onPress={() => {
                ValoraAnalytics.track(EarnEvents.earn_exit_pool_press, {
                  depositTokenId,
                  networkId: poolToken.networkId,
                  tokenAmount: poolToken.balance.toString(),
                  providerId: PROVIDER_ID,
                })
                navigate(Screens.EarnCollectScreen, { depositTokenId, poolTokenId })
              }}
              text={t('earnFlow.activePools.exitPool')}
              type={BtnTypes.SECONDARY}
              size={BtnSizes.FULL}
              style={styles.button}
            />
            <Button
              onPress={() => {
                ValoraAnalytics.track(EarnEvents.earn_deposit_more_press, {
                  depositTokenId,
                  providerId: PROVIDER_ID,
                  networkId: poolToken.networkId,
                })
                navigate(Screens.EarnEnterAmount, { tokenId: depositTokenId })
              }}
              text={t('earnFlow.activePools.depositMore')}
              type={BtnTypes.PRIMARY}
              size={BtnSizes.FULL}
              style={styles.button}
            />
          </View>
        )}
        {cta === 'ViewPools' && (
          <View style={styles.buttonContainer}>
            <Button
              onPress={() => {
                ValoraAnalytics.track(EarnEvents.earn_view_pools_press, {
                  poolTokenId,
                  networkId: poolToken.networkId,
                  providerId: PROVIDER_ID,
                })
                navigate(Screens.TabDiscover)
              }}
              text={t('earnFlow.activePools.viewPools')}
              type={BtnTypes.SECONDARY}
              size={BtnSizes.FULL}
              style={styles.button}
            />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
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
  totalValueText: {
    ...typeScale.bodySmall,
  },
  apyContainer: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  apyText: {
    color: Colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexGrow: 1,
  },
  container: {
    flexDirection: 'column',
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
