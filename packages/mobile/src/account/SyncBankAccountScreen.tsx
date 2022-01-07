import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'

import * as React from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { LinkSuccessMetadata } from 'react-native-plaid-link-sdk'
import { createFinclusiveBankAccount, exchangePlaidAccessToken } from 'src/in-house-liquidity'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import Loading from 'src/walletConnect/screens/Loading'
import { mtwAddressSelector, walletAddressSelector } from 'src/web3/selectors'

type Props = StackScreenProps<StackParamList, Screens.SyncBankAccountScreen>

const SyncBankAccountScreen = ({ route }: Props) => {
  const { t } = useTranslation()
  const accountMTWAddress = useSelector(mtwAddressSelector) || ''
  const walletAddress = useSelector(walletAddressSelector) || ''
  const { publicToken, metadata } = route.params

  useAsync(async () => {
    const accessTokenResponse = await exchangePlaidAccessToken({
      accountMTWAddress,
      walletAddress,
      publicToken,
    })
    if (!accessTokenResponse.ok) {
      // TODO(wallet#1447): handle errors from IHL
      console.debug('FAIL', JSON.stringify(accessTokenResponse))

      return
    }
    const { accessToken } = await accessTokenResponse.json()

    const finclusiveBankAccountResponse = await createFinclusiveBankAccount({
      accountMTWAddress,
      walletAddress,
      plaidAccessToken: accessToken,
    })
    if (!finclusiveBankAccountResponse.ok) {
      // TODO(wallet#1447): handle errors from IHL
      console.debug('FAIL', JSON.stringify(finclusiveBankAccountResponse))

      return
    }
    console.debug('SUCESS WITH FINCLUSIVE')
    // TODO(wallet#1449): redirect to Bank Account List Page
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.greenBrand} />
      <Text style={styles.connecting}>{'Syncing Bank Account'}</Text>
    </View>
  )
}

SyncBankAccountScreen.navigationOptions = () => {
  return {}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connecting: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: 20,
  },
})

export default SyncBankAccountScreen
