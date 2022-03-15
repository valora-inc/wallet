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
import { publicKeySelector, walletAddressSelector } from 'src/web3/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { useDispatch } from 'react-redux'
import { setHasLinkedBankAccount } from 'src/account/actions'
import { getWalletAsync } from 'src/web3/contracts'
import { requestPincodeInput } from 'src/pincode/authentication'

type Props = StackScreenProps<StackParamList, Screens.SyncBankAccountScreen>

const SyncBankAccountScreen = ({ route }: Props) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const walletAddress = useSelector(walletAddressSelector)
  const publicKey = useSelector(publicKeySelector)

  const { publicToken } = route.params

  useAsync(async () => {
    const wallet = await getWalletAsync()
    if (!walletAddress) {
      throw new Error('Cannot call IHL because walletAddress is null')
    }
    if (!publicKey) {
      throw new Error('Cannot call IHL because publicKey is null')
    }
    if (!wallet.isAccountUnlocked(walletAddress)) {
      await requestPincodeInput(true, false, walletAddress)
    }
    try {
      const accessToken = await exchangePlaidAccessToken({
        wallet,
        walletAddress,
        publicKey,
        publicToken,
      })

      await createFinclusiveBankAccount({
        wallet,
        walletAddress,
        publicKey,
        plaidAccessToken: accessToken,
      })
      dispatch(setHasLinkedBankAccount())
      navigate(Screens.BankAccounts, { newPublicToken: publicToken })
    } catch (error) {
      navigate(Screens.LinkBankAccountErrorScreen, { error })
      return
    }
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
