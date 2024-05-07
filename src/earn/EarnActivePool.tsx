import React from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TokenDisplay from 'src/components/TokenDisplay'
import { getAavePoolInfo, getAavePoolUserBalance } from 'src/earn/poolInfo'
import UpwardGraph from 'src/icons/UpwardGraph'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address } from 'viem'

const TAG = 'earn/EarnActivePool'

export default function EarnActivePool() {
  const { t } = useTranslation()
  const token = useTokenInfo(networkConfig.arbUsdcTokenId)
  const walletAddress = useSelector(walletAddressSelector)

  const asyncPoolInfo = useAsync(async () => {
    if (!token) {
      // should never happen
      Logger.warn(TAG, `Token with id ${networkConfig.arbUsdcTokenId} not found`)
      throw new Error(`Token with id ${networkConfig.arbUsdcTokenId} not found`)
    }
    return getAavePoolInfo(token.address as Address)
  }, [])

  const asyncPoolUserInfo = useAsync(async () => {
    if (!token) {
      // should never happen
      Logger.warn(TAG, `Token with id ${networkConfig.arbUsdcTokenId} not found`)
      throw new Error(`Token with id ${networkConfig.arbUsdcTokenId} not found`)
    }
    return getAavePoolUserBalance({
      walletAddress: walletAddress as Address,
      assetAddress: token.address as Address,
    })
  }, [])

  return (
    <View style={styles.card} testID={`ActivePool-${networkConfig.arbUsdcTokenId}`}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('earnStablecoin.activePools')}</Text>
        <View>
          <View style={styles.row}>
            <Text style={styles.totalValueText}>{t('earnStablecoin.totalValue')}</Text>
            {asyncPoolUserInfo.result && (
              <TokenDisplay
                amount={asyncPoolUserInfo.result.balanceInDecimal.toString()}
                showLocalAmount={false}
                testID={`${networkConfig.arbUsdcTokenId}-totalAmount`}
                tokenId={networkConfig.arbUsdcTokenId}
              />
            )}
          </View>
          <View style={styles.row}>
            {asyncPoolInfo.result && (
              <View style={styles.apyContainer}>
                <Text style={styles.apyText}>
                  {t('earnStablecoin.apy', {
                    apy: (asyncPoolInfo.result.apy * 100).toFixed(2) ?? '',
                  })}
                </Text>
                <UpwardGraph />
              </View>
            )}

            {asyncPoolUserInfo.result && (
              <TokenDisplay
                amount={asyncPoolUserInfo.result.balanceInDecimal}
                showLocalAmount={true}
                testID={`${networkConfig.arbUsdcTokenId}-totalAmount`}
                tokenId={networkConfig.arbUsdcTokenId}
              />
            )}
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => {
              console.log('Press')
            }}
            text={'Exit Pool'}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.FULL}
            style={styles.button}
          />
          <Button
            onPress={() => console.log('Press')}
            text={'Deposit More'}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.FULL}
            style={styles.button}
          />
        </View>
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
