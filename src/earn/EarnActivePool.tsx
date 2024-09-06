import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import TokenDisplay from 'src/components/TokenDisplay'
import { PROVIDER_ID } from 'src/earn/constants'
import { useEarnPosition } from 'src/earn/hooks'
import { poolInfoFetchStatusSelector, poolInfoSelector } from 'src/earn/selectors'
import { fetchPoolInfo } from 'src/earn/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
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
  const dispatch = useDispatch()
  const poolToken = useTokenInfo(poolTokenId)
  const poolInfo = useSelector(poolInfoSelector)
  const poolInfoFetchStatus = useSelector(poolInfoFetchStatusSelector)
  const earnPosition = useEarnPosition(poolTokenId)

  useEffect(() => {
    dispatch(fetchPoolInfo())
  }, [])

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
            {poolInfoFetchStatus === 'loading' ? (
              <PoolDetailsLoading />
            ) : poolInfo?.apy ? (
              <View style={styles.apyContainer}>
                <Text style={styles.apyText}>
                  {t('earnFlow.activePools.apy', {
                    apy: (poolInfo.apy * 100).toFixed(2),
                  })}
                </Text>
              </View>
            ) : (
              <View />
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
                earnPosition &&
                  AppAnalytics.track(EarnEvents.earn_exit_pool_press, {
                    depositTokenId,
                    networkId: poolToken.networkId,
                    tokenAmount: poolToken.balance.toString(),
                    providerId: earnPosition.appId,
                    poolId: earnPosition.positionId,
                  })
                earnPosition && navigate(Screens.EarnCollectScreen, { pool: earnPosition })
              }}
              text={t('earnFlow.activePools.exitPool')}
              type={BtnTypes.SECONDARY}
              size={BtnSizes.FULL}
              style={styles.button}
            />
            <Button
              onPress={() => {
                earnPosition &&
                  AppAnalytics.track(EarnEvents.earn_deposit_more_press, {
                    depositTokenId,
                    providerId: earnPosition.appId,
                    networkId: poolToken.networkId,
                    poolId: earnPosition.positionId,
                  })
                earnPosition && navigate(Screens.EarnEnterAmount, { pool: earnPosition })
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
                AppAnalytics.track(EarnEvents.earn_view_pools_press, {
                  poolTokenId,
                  networkId: poolToken.networkId,
                  providerId: PROVIDER_ID,
                })
                navigate(
                  getFeatureGate(StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
                    ? Screens.EarnHome
                    : Screens.TabDiscover
                )
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
