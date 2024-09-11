import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import CustomHeader from 'src/components/header/CustomHeader'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import variables from 'src/styles/variables'
import { navigateToURI } from 'src/utils/linking'

const openExternalLink = (link: string) => () => navigateToURI(link)

const onPressContact = () => {
  navigate(Screens.SupportContact)
}

const Support = () => {
  const { t } = useTranslation()
  const { externalLinks } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])

  return (
    <SafeAreaView>
      <CustomHeader left={<BackButton />} title={t('help')} style={styles.paddingHorizontal} />
      <ScrollView>
        {!!externalLinks.faq && (
          <SettingsItemTextValue
            testID="FAQLink"
            title={t('faq')}
            onPress={openExternalLink(externalLinks.faq)}
            isExternalLink
          />
        )}
        {!!externalLinks.forum && (
          <SettingsItemTextValue
            testID="ForumLink"
            title={t('forum')}
            onPress={openExternalLink(externalLinks.forum)}
            isExternalLink
          />
        )}

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
