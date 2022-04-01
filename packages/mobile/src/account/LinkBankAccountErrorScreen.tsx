import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BorderlessButton from 'src/components/BorderlessButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'

const TAG = 'LinkBankAccountErrorScreen'
type Props = StackScreenProps<StackParamList, Screens.LinkBankAccountErrorScreen>

function LinkBankAccountErrorScreen({ route }: Props) {
  const { t } = useTranslation()

  const { error } = route.params || {}
  if (error instanceof Error) {
    Logger.warn(TAG, 'Error from IHL while adding bank account', error)
  } else {
    Logger.warn(TAG, 'Error from Plaid while adding bank account', error)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('linkBankAccountScreen.stepTwo.error.title')}</Text>
      <Text style={styles.description}>{t('linkBankAccountScreen.stepTwo.error.description')}</Text>
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
              prefilledText: t('linkBankAccountScreen.stepTwo.error.contactSupportPrefill'),
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
