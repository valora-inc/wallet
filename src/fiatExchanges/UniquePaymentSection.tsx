import React from 'react'

import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import { CICOFlow, FetchProvidersOutput, PaymentMethod } from 'src/fiatExchanges/utils'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

export interface UniquePaymentSectionProps {
  paymentMethod: PaymentMethod
  uniqueProvider: FetchProvidersOutput | null
  setNoPaymentMethods: React.Dispatch<React.SetStateAction<boolean>>
  flow: CICOFlow
}

export function UniquePaymentSection({
  paymentMethod,
  uniqueProvider,
  setNoPaymentMethods,
  flow,
}: UniquePaymentSectionProps) {
  const { t } = useTranslation()

  if (!uniqueProvider || uniqueProvider.restricted) {
    setNoPaymentMethods(true)
    return null
  }

  return (
    <View style={styles.container}>
      <Touchable>
        <View style={{ ...styles.innerContainer, paddingVertical: 27 }}>
          <View style={styles.left}>
            <Text style={styles.category}>
              {paymentMethod === PaymentMethod.Coinbase
                ? t('selectProviderScreen.coinbase')
                : t('selectProviderScreen.somePaymentsUnavailable')}
            </Text>

            <Text style={styles.fee}>{t('selectProviderScreen.feesVary')}</Text>
          </View>

          <View style={styles.right}>
            <Image source={{ uri: uniqueProvider.logo }} style={styles.providerImage} />
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
