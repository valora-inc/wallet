import BorderlessButton from '@celo/react-components/components/BorderlessButton'
import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import * as React from 'react'
import fontStyles from '@celo/react-components/styles/fonts'
import { StyleSheet, Text, View } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { StackParamList } from 'src/navigator/types'
import { Screens } from 'src/navigator/Screens'
import { useTranslation } from 'react-i18next'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'

const TAG = 'LinkBankAccountErrorScreen'
type Props = StackScreenProps<StackParamList, Screens.LinkBankAccountErrorScreen>

function LinkBankAccountErrorScreen({ route }: Props) {
  const { t } = useTranslation()

  const { error, linkError } = route.params || {}
  if (error) {
    Logger.warn(TAG, 'Error from IHL while adding bank account', error)
  } else if (linkError) {
    Logger.warn(TAG, 'Error from Plaid while adding bank account', linkError)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('linkBankAccountScreen.error.title')}</Text>
      <Text style={styles.description}>{t('linkBankAccountScreen.error.description')}</Text>
      <Button
        style={styles.button}
        testID="TryAgain"
        onPress={() => navigateBack()}
        text={t('linkBankAccountScreen.tryAgain')}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
      />
      <View style={styles.contactSupportButton}>
        <BorderlessButton
          testID="SupportContactLink"
          onPress={() => {
            navigate(Screens.SupportContact, {
              prefilledText: t('linkBankAccountScreen.error.contactSupportPrefill'),
            })
          }}
        >
          <Text style={styles.contactSupport}>{t('contactSupport')}</Text>
        </BorderlessButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 48,
  },
  button: {
    marginTop: 13,
  },
  contactSupport: {
    ...fontStyles.regular600,
  },
  contactSupportButton: {
    marginTop: 26,
  },
})

export default LinkBankAccountErrorScreen
