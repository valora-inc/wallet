import { StackScreenProps } from '@react-navigation/stack'
import { isNull } from 'lodash'
import React, { useEffect, useMemo } from 'react'
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { accountAddressSelector } from 'src/web3/selectors'

const TAG = 'onboarding/keyshare'

type Props = {} & StackScreenProps<StackParamList, Screens.KeyshareProvisioningScreen>

const KeyshareProvisioningScreen = (_props: Props) => {
  const account = useSelector(accountAddressSelector)

  const accountReady = useMemo(() => {
    return !isNull(account)
  }, [account])

  useEffect(() => {
    if (accountReady) {
      handleAccountReady()
    }
  }, [accountReady])

  const handleAccountReady = () => {
    goToNextScreen()
  }

  const goToNextScreen = () => {
    navigateClearingStack(Screens.NuxInterests)
  }

  return (
    <SafeAreaView>
      <Text>Waiting for account creation</Text>
    </SafeAreaView>
  )
}

export default KeyshareProvisioningScreen
