import React from 'react'

import { generateOnRampURL } from '@coinbase/cbpay-js'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { coinbasePayEnabledSelector } from 'src/app/selectors'
import Touchable from 'src/components/Touchable'
import { FetchProvidersOutput } from 'src/fiatExchanges/utils'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { CiCoCurrency } from 'src/utils/currencies'
import { walletAddressSelector } from 'src/web3/selectors'

export interface CoinbasePaymentSectionProps {
  digitalAsset: CiCoCurrency
  cryptoAmount: number
  coinbaseProvider: FetchProvidersOutput | undefined
}

export function CoinbasePaymentSection({
  digitalAsset,
  cryptoAmount,
  coinbaseProvider,
}: CoinbasePaymentSectionProps) {
  const { t } = useTranslation()
  const coinbasePayEnabled = useSelector(coinbasePayEnabledSelector)
  const walletAddress = useSelector(walletAddressSelector)!
  const allowedAssets = [CiCoCurrency.CELO]

  const appIdResponse = useAsync(async () => readOnceFromFirebase('coinbasePay/appId'), [])
  const appId = appIdResponse.result

  if (
    !coinbaseProvider ||
    coinbaseProvider.restricted ||
    !coinbasePayEnabled ||
    !allowedAssets.includes(digitalAsset)
  ) {
    return null
  }

  // Using 'CGLD' as temp replacement for CiCoCurrency.CELO – digitalAsset
  const coinbasePayURL = generateOnRampURL({
    appId,
    destinationWallets: [{ address: walletAddress, blockchains: ['celo'], assets: ['CGLD'] }],
    presetCryptoAmount: cryptoAmount,
  })

  const navigateCoinbasePayFlow = () => {
    navigate(Screens.WebViewScreen, { uri: coinbasePayURL })
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
