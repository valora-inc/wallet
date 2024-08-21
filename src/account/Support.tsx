import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import { FAQ_LINK, FORUM_LINK } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

const openExternalLink = (link: string) => () => navigateToURI(link)

const onPressContact = () => {
  navigate(Screens.SupportContact)
}

const Support = () => {
  const { t } = useTranslation()

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']}>
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

export default Support
