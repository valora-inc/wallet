import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import { isEmpty } from 'lodash'
import React, { useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { waitUntilSagasFinishLoading } from 'src/redux/sagas'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useCapsule } from 'src/web3/hooks'

type RouteProps = StackScreenProps<StackParamList, Screens.CapsuleOAuth>
type Props = RouteProps

function CapsuleOAuthScreen({ route, navigation }: Props) {
  const { t } = useTranslation()
  const { isExistingUser } = route.params || {}
  const { authenticate, initiateLogin } = useCapsule()

  const headerHeight = useHeaderHeight()

  const [email, setEmail] = useState<string>('')

  const onChangeEmail = (email: string) => {
    setEmail(email)
  }

  const onSubmit = async () => {
    if (isExistingUser) {
      await initiateLogin(email)
    } else {
      await authenticate(email)
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Logo type={LogoTypes.LIGHT} />,
      headerLeft: () => <BackButton color={Colors.light} />,
    })
  }, [navigation, route.params])

  useAsync(async () => {
    await waitUntilSagasFinishLoading()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
        style={[headerHeight ? { marginTop: headerHeight } : undefined, styles.accessibleView]}
      >
        <View style={styles.inputGroup}>
          {isExistingUser && (
            <Text style={[styles.emailLabel, styles.bottomPadded]}>{t('welcomeBack')}</Text>
          )}
          <Text style={styles.emailLabel}>{t('signUp.emailLabel')}</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            caretHidden={true}
            placeholder={t('signUp.emailPlaceholder')}
            placeholderTextColor={Colors.greenFaint}
            style={styles.emailTextInput}
            keyboardType={'email-address'}
            onChangeText={onChangeEmail}
          />
        </View>
        <View style={styles.flexBottom}>
          <Button
            type={BtnTypes.BRAND_PRIMARY}
            size={BtnSizes.FULL}
            text={t('next')}
            onPress={onSubmit}
            disabled={isEmpty(email)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greenUI,
  },
  accessibleView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bottomPadded: {},
  inputGroup: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  flexBottom: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  emailLabel: {
    ...fontStyles.hero,
    color: Colors.light,
  },
  emailTextInput: {
    ...fontStyles.hero,
    color: Colors.light,
  },
})

CapsuleOAuthScreen.navigationOptions = nuxNavigationOptions
export default CapsuleOAuthScreen
