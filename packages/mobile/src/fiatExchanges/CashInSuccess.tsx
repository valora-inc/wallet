import Button from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { cicoProviderSupportEmails } from 'src/config'
import { Namespaces } from 'src/i18n'
import { fiatExchange } from 'src/images/Images'
import { noHeaderGestureDisabled } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { navigateToURI } from 'src/utils/linking'

type RouteProps = StackScreenProps<StackParamList, Screens.CashInSuccess>
type Props = RouteProps

function CashInSuccessScreen({ route }: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const { provider } = route.params
  const providerSupportEmail = provider ? cicoProviderSupportEmails[provider] : null

  const openProviderSupportEmail = () => {
    if (providerSupportEmail) {
      // TODO: Add non-native email client support by generalizing the mail function
      // used in SupportContact.tsx and using instead of `navigateToURI`
      navigateToURI(`mailto:${providerSupportEmail}`)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={fiatExchange} style={styles.image} resizeMode={'contain'} />
        <Text style={styles.title}>{t('cicoSuccess.title')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.contentText}>
          {t('cicoSuccess.body1')}
          <Text
            style={providerSupportEmail ? styles.emailLink : null}
            onPress={openProviderSupportEmail}
          >
            {`${providerSupportEmail || t('cicoSuccess.body2')}`}
          </Text>
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            style={styles.button}
            text={t('global:continue')}
            accessibilityLabel={t('global:continue')}
            onPress={navigateHome}
          />
        </View>
      </View>
    </View>
  )
}

CashInSuccessScreen.navigationOptions = () => ({
  ...noHeaderGestureDisabled,
})

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    marginBottom: 30,
  },
  title: {
    ...fontStyles.large500,
  },
  content: {
    flex: 0,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  contentText: {
    ...fontStyles.regular,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingTop: 16,
    flexDirection: 'row',
  },
  button: {
    minWidth: 200,
    width: '100%',
    alignSelf: 'stretch',
    flex: 1,
    flexDirection: 'column',
  },
  emailLink: {
    color: colors.greenUI,
  },
})

export default CashInSuccessScreen
