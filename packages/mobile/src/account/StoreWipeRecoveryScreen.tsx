import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import TextButton from '@celo/react-components/components/TextButton'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { startStoreWipeRecovery } from 'src/account/actions'
import { Namespaces } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { requestPincodeInput } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'

type Props = StackScreenProps<StackParamList, Screens.StoreWipeRecoveryScreen>

const TAG = 'StoreWipeRecoveryScreen'

function StoreWipeRecoveryScreen({ route }: Props) {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const dispatch = useDispatch()

  const goToOnboarding = async () => {
    try {
      const account = route.params.account
      await requestPincodeInput(true, false, account)
      dispatch(startStoreWipeRecovery())
      navigate(Screens.NameAndPicture)
    } catch (error) {
      Logger.error(`${TAG}@goToOnboarding`, 'PIN error', error)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} testID={'StoreWipeRecovery'}>
          {t('storeRecoveryTitle')}
        </Text>
        <Text style={styles.body}>{t('storeRecoveryBody')}</Text>
        <TextButton onPress={goToOnboarding} testID="GoToOnboarding">
          {t('storeRecoveryButton')}
        </TextButton>
      </ScrollView>
      <KeyboardSpacer />
    </View>
  )
}

StoreWipeRecoveryScreen.navOptions = {
  ...emptyHeader,
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
