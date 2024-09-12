import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import CustomHeader from 'src/components/header/CustomHeader'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { navigateToURI } from 'src/utils/linking'

const LegalSubmenu = () => {
  const { t } = useTranslation()

  const insets = useSafeAreaInsets()
  const insetsStyle = { paddingBottom: Math.max(insets.bottom, Spacing.Regular16) }

  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])

  const goToLicenses = () => {
    AppAnalytics.track(SettingsEvents.licenses_view)
    navigate(Screens.Licenses)
  }

  const onTermsPress = () => {
    AppAnalytics.track(SettingsEvents.tos_view)
    navigateToURI(links.tos)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader left={<BackButton />} title={t('legal')} style={styles.header} />
      <ScrollView style={insetsStyle}>
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
          onPress={() => navigateToURI(links.privacy)}
          borderless
          isExternalLink
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: variables.contentPadding,
  },
  container: {
    flex: 1,
  },
})

export default LegalSubmenu
