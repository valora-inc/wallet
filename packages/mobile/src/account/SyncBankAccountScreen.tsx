import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'

import * as React from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { createFinclusiveBankAccount, exchangePlaidAccessToken } from 'src/in-house-liquidity'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { dataEncryptionKeySelector, mtwAddressSelector } from 'src/web3/selectors'
import Logger from 'src/utils/Logger'
import { navigate } from 'src/navigator/NavigationService'

const TAG = 'SYNC_BANK_ACCOUNT'

type Props = StackScreenProps<StackParamList, Screens.SyncBankAccountScreen>

const SyncBankAccountScreen = ({ route }: Props) => {
  const { t } = useTranslation()
  const accountMTWAddress = useSelector(mtwAddressSelector) || ''
  const dekPrivate = useSelector(dataEncryptionKeySelector)
  const { publicToken } = route.params

  useAsync(async () => {
    if (!dekPrivate) {
      Logger.error(TAG, "Can't connect the users bank account because dekPrivate is null")
      return
    }
    const accessTokenResponse = await exchangePlaidAccessToken({
      accountMTWAddress,
      dekPrivate,
      publicToken,
    })
    if (!accessTokenResponse.ok) {
      // TODO(wallet#1447): handle errors from IHL
      return
    }
    const { accessToken } = await accessTokenResponse.json()

    const finclusiveBankAccountResponse = await createFinclusiveBankAccount({
      accountMTWAddress,
      dekPrivate,
      plaidAccessToken: accessToken,
    })
    if (!finclusiveBankAccountResponse.ok) {
      // TODO(wallet#1447): handle errors from IHL
      return
    }
    navigate(Screens.BankAccounts, { newPublicToken: publicToken })
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.greenBrand} />
      <Text style={styles.connecting}>{t('syncingBankAccount')}</Text>
    </View>
  )
}

SyncBankAccountScreen.navigationOptions = () => {
  return {
    ...noHeader,
  }
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
