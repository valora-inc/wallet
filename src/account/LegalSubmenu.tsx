import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { PRIVACY_LINK, TOS_LINK } from 'src/config'
import CustomHeader from 'src/components/header/CustomHeader'
import variables from 'src/styles/variables'
import BackButton from 'src/components/BackButton'

const LegalSubmenu = () => {
  const { t } = useTranslation()

  const goToLicenses = () => {
    AppAnalytics.track(SettingsEvents.licenses_view)
    navigate(Screens.Licenses)
  }

  const onTermsPress = () => {
    AppAnalytics.track(SettingsEvents.tos_view)
    navigateToURI(TOS_LINK)
  }

  return (
    <ScrollView>
      <SafeAreaView>
        <CustomHeader left={<BackButton />} title={t('legal')} style={styles.header} />
        <SettingsItemTextValue
          testID="LegalSubmenu/Licenses"
          title={t('licenses')}
          onPress={goToLicenses}
          showChevron
        />
        <SettingsItemTextValue
          testID="LegalSubmenu/Terms"
          title={t('termsOfServiceLink')}
          onPress={onTermsPress}
          isExternalLink
        />
        <SettingsItemTextValue
          testID="LegalSubmenu/Privacy"
          title={t('privacyPolicy')}
          onPress={() => navigateToURI(PRIVACY_LINK)}
          borderless
          isExternalLink
        />
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: variables.contentPadding,
  },
})

export default LegalSubmenu
