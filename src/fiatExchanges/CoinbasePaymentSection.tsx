import React from 'react'

import { generateOnRampURL } from '@coinbase/cbpay-js'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { CoinbasePayEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import { ProviderSelectionAnalyticsData } from 'src/fiatExchanges/types'
import { FetchProvidersOutput } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

export interface CoinbasePaymentSectionProps {
  cryptoAmount: number
  coinbaseProvider: FetchProvidersOutput
  appId: string
  analyticsData: ProviderSelectionAnalyticsData
  tokenId: string
}

export function CoinbasePaymentSection({
  cryptoAmount,
  coinbaseProvider,
  appId,
  analyticsData,
  tokenId,
}: CoinbasePaymentSectionProps) {
  const { t } = useTranslation()
  const walletAddress = useSelector(walletAddressSelector)!
  const tokenInfo = useTokenInfo(tokenId)

  if (!tokenInfo) {
    // should never happen
    Logger.debug('CoinbasePaymentSection', 'Token info not found for token: ' + tokenId)
    return null
  }

  const network = networkIdToNetwork[tokenInfo.networkId]
  // Coinbase still thinks CELO is CGLD
  const symbol = tokenInfo.symbol === 'CELO' ? 'CGLD' : tokenInfo.symbol

  const coinbasePayURL = generateOnRampURL({
    appId,
    destinationWallets: [
      { address: walletAddress, supportedNetworks: [network], assets: [symbol] },
    ],
    presetCryptoAmount: cryptoAmount,
  })

  const navigateCoinbasePayFlow = () => {
    ValoraAnalytics.track(CoinbasePayEvents.coinbase_pay_flow_start, analyticsData)
    navigate(Screens.CoinbasePayScreen, { uri: coinbasePayURL })
  }

  return (
    <View style={styles.container}>
      <Touchable onPress={navigateCoinbasePayFlow} testID="coinbasePayCard">
        <View style={{ ...styles.innerContainer, paddingVertical: 27 }}>
          <View style={styles.left}>
            <Text style={styles.category}>Coinbase Pay</Text>

            <Text style={styles.fee}>{t('selectProviderScreen.feesVary')}</Text>
          </View>

          <View style={styles.right}>
            <Image source={{ uri: coinbaseProvider.logo }} style={styles.providerImage} />
          </View>
        </View>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
  },
  providerImage: {
    flex: 1,
    width: 160,
    height: 40,
    resizeMode: 'contain',
  },
  innerContainer: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  right: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  category: {
    ...fontStyles.small,
  },
  fee: {
    ...fontStyles.small600,
    marginTop: 4,
  },
})
