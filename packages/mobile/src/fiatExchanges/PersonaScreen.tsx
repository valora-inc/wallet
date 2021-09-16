import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { Button, StyleSheet, View } from 'react-native'
import Inquiry, { Environment, InquiryAttributes } from 'react-native-persona'
import BackButton from 'src/components/BackButton'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = StackScreenProps<StackParamList, Screens.PersonaScreen>

// const supportedLanguages = ['en', 'fr', 'es', 'nl']

// const getPlaidLanguage = (appLanguage: string) => {
//   let plaidLanguage: string | undefined
//   const lowercaseAppLang = appLanguage.toLowerCase()
//   for (const lang of supportedLanguages) {
//     if (lowercaseAppLang.startsWith(lang)) {
//       plaidLanguage = lang
//     }
//   }

//   return plaidLanguage || 'en'
// }

const InquiryLauncher = ({ templateId }: { [templateId: string]: string }) => {
  const handleBeginInquiry = useCallback(() => {
    Inquiry.fromTemplate(templateId)
      .environment(Environment.SANDBOX)
      .onSuccess((inquiryId: string, attributes: InquiryAttributes) => {
        console.log(`Inquiry completed for ${inquiryId} with attributes: ${attributes}`)
      })
      .onCancelled(() => {
        console.log('Inquiry #{inquiryId} canceled.')
      })
      .onError((error: Error) => {
        console.error(`Error: ${error.message}`)
      })
      .build()
      .start()
  }, [templateId])

  return <Button onPress={handleBeginInquiry} title="Start inquiry" />
}

function PersonaScreen({ route, navigation }: Props) {
  const templateId = 'tmpl_zXHYe4JZnuwfMxhzkpmdm45b'

  return (
    <View style={styles.container}>
      <InquiryLauncher templateId={templateId} />
    </View>
  )
}

PersonaScreen.navigationOptions = () => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
    headerTitle: i18n.t('fiatExchangeFlow:addFunds'),
  }
}

export default PersonaScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
})
