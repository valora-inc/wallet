import React from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import TokenDisplay from 'src/components/TokenDisplay'
import { fetchAavePoolInfo } from 'src/earn/poolInfo'
import UpwardGraph from 'src/icons/UpwardGraph'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { isAddress } from 'viem'

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
  const depositToken = useTokenInfo(depositTokenId)
  const poolToken = useTokenInfo(poolTokenId)
  const asyncPoolInfo = useAsync(
    async () => {
      if (!depositToken || !depositToken.address) {
        throw new Error(`Token with id ${depositTokenId} not found`)
      }

      if (!isAddress(depositToken.address)) {
        throw new Error(`Token with id ${depositTokenId} does not contain a valid address`)
      }

      return fetchAavePoolInfo({
        assetAddress: depositToken.address,
        contractAddress: networkConfig.arbAavePoolV3ContractAddress,
        network: networkIdToNetwork[depositToken.networkId],
      })
    },
    [],
    {
      onError: (error) => {
        Logger.warn(TAG, error.message)
      },
    }
  )

  return (
    <View style={styles.card} testID="EarnActivePool">
      <View style={styles.container}>
        <Text style={styles.title}>{t('earnFlow.activePools.title')}</Text>
        <View>
          <View style={styles.row}>
            <Text style={styles.totalValueText}>{t('earnFlow.activePools.totalValue')}</Text>
            {poolToken && poolToken.balance && (
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
            {poolToken && poolToken.balance && (
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
                // TODO (act-1180) create earn review withdraw screen
                // Will navigate to this screen with appropriate props
                // fire analytics
              }}
              text={t('earnFlow.activePools.exitPool')}
              type={BtnTypes.GRAY_WITH_BORDER}
              size={BtnSizes.FULL}
              style={styles.button}
            />
            <Button
              onPress={() => {
                // TODO (act-1176) create earn enter amount screen
                // Will navigate to this screen with appropriate props
                // fire analytics
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
                ValoraAnalytics.track(EarnEvents.earn_view_pools_press)
                navigate(Screens.TabDiscover)
              }}
              text={t('earnFlow.activePools.viewPools')}
              type={BtnTypes.GRAY_WITH_BORDER}
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
