import TextButton from '@celo/react-components/components/TextButton'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { startStoreWipeRecovery } from 'src/account/actions'
import { Namespaces } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { requestPincodeInput } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import { getWalletAsync } from 'src/web3/contracts'

type Props = StackScreenProps<StackParamList, Screens.StoreWipeRecoveryScreen>

const TAG = 'StoreWipeRecoveryScreen'

function StoreWipeRecoveryScreen({ route }: Props) {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const dispatch = useDispatch()

  const goToOnboarding = async () => {
    try {
      const wallet = await getWalletAsync()
      const account = wallet.getAccounts()[0]
      await requestPincodeInput(true, false, account)
      dispatch(startStoreWipeRecovery(account))
      navigate(Screens.NameAndPicture)
    } catch (error) {
      Logger.error(`${TAG}@goToOnboarding`, 'PIN error', error)
    }
  }

  return (
    <SafeAreaView style={styles.content}>
      <Text style={styles.title} testID={'StoreWipeRecovery'}>
        {t('storeRecoveryTitle')}
      </Text>
      <Text style={styles.body}>{t('storeRecoveryBody')}</Text>
      <TextButton onPress={goToOnboarding} testID="GoToOnboarding">
        {t('storeRecoveryButton')}
      </TextButton>
    </SafeAreaView>
  )
}

StoreWipeRecoveryScreen.navOptions = {
  ...emptyHeader,
  headerLeft: () => null,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginHorizontal: Spacing.Thick24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingBottom: Spacing.Regular16,
    paddingTop: Spacing.Regular16,
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingBottom: Spacing.Thick24,
  },
})

export default StoreWipeRecoveryScreen
