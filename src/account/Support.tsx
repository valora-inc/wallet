import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import { FAQ_LINK, FORUM_LINK } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import CustomHeader from 'src/components/header/CustomHeader'
import variables from 'src/styles/variables'
import BackButton from 'src/components/BackButton'

const openExternalLink = (link: string) => () => navigateToURI(link)

const onPressContact = () => {
  navigate(Screens.SupportContact)
}

const Support = () => {
  const { t } = useTranslation()

  return (
    <SafeAreaView>
      <CustomHeader left={<BackButton />} title={t('help')} style={styles.paddingHorizontal} />
      <ScrollView>
        <SettingsItemTextValue
          testID="FAQLink"
          title={t('faq')}
          onPress={openExternalLink(FAQ_LINK)}
          isExternalLink
        />
        <SettingsItemTextValue
          testID="ForumLink"
          title={t('forum')}
          onPress={openExternalLink(FORUM_LINK)}
          isExternalLink
        />
        <SettingsItemTextValue
          testID="SupportContactLink"
          title={t('contact')}
          onPress={onPressContact}
          borderless
          showChevron
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  paddingHorizontal: {
    paddingHorizontal: variables.contentPadding,
  },
})

export default Support
