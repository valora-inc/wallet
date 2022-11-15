import React from 'react'

import { generateOnRampURL } from '@coinbase/cbpay-js'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { CoinbasePayEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import { FetchProvidersOutput } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { walletAddressSelector } from 'src/web3/selectors'

export interface CoinbasePaymentSectionProps {
  cryptoAmount: number
  coinbaseProvider: FetchProvidersOutput
  appId: string
}

export function CoinbasePaymentSection({
  cryptoAmount,
  coinbaseProvider,
  appId,
}: CoinbasePaymentSectionProps) {
  const { t } = useTranslation()
  const walletAddress = useSelector(walletAddressSelector)!

  // Using 'CGLD' as temp replacement for CiCoCurrency.CELO – digitalAsset
  const coinbasePayURL = generateOnRampURL({
    appId,
    destinationWallets: [{ address: walletAddress, blockchains: ['celo'], assets: ['CGLD'] }],
    presetCryptoAmount: cryptoAmount,
  })

  const navigateCoinbasePayFlow = () => {
    ValoraAnalytics.track(CoinbasePayEvents.coinbase_pay_flow_start)
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
    ...fontStyles.small500,
  },
  fee: {
    ...fontStyles.regular500,
    marginTop: 4,
  },
})
