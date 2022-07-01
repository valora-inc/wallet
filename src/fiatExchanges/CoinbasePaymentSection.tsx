import React from 'react'

import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { coinbasePayEnabledSelector } from 'src/app/selectors'
import Touchable from 'src/components/Touchable'
import { FetchProvidersOutput } from 'src/fiatExchanges/utils'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

export interface CoinbasePaymentSectionProps {
  coinbaseProvider: FetchProvidersOutput | undefined
  setNoPaymentMethods: React.Dispatch<React.SetStateAction<boolean>>
}

export function CoinbasePaymentSection({
  coinbaseProvider,
  setNoPaymentMethods,
}: CoinbasePaymentSectionProps) {
  const { t } = useTranslation()
  const coinbasePayEnabled = useSelector(coinbasePayEnabledSelector)

  if (!coinbaseProvider || coinbaseProvider.restricted || !coinbasePayEnabled) {
    setNoPaymentMethods(true)
    return null
  }

  return (
    <View style={styles.container}>
      <Touchable>
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
