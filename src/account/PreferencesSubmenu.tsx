import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SettingsItemTextValue, SettingsItemSwitch } from 'src/components/SettingsItem'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { currentLanguageSelector } from 'src/i18n/selectors'
import locales from 'locales'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { hapticFeedbackEnabledSelector } from 'src/app/selectors'
import { hapticFeedbackSet } from 'src/app/actions'
import CustomHeader from 'src/components/header/CustomHeader'
import variables from 'src/styles/variables'
import BackButton from 'src/components/BackButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.PreferencesSubmenu>

const PreferencesSubmenu = ({ route }: Props) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const currentLanguage = useSelector(currentLanguageSelector)
  const preferredCurrencyCode = useSelector(getLocalCurrencyCode)
  const hapticFeedbackEnabled = useSelector(hapticFeedbackEnabledSelector)

  const insets = useSafeAreaInsets()
  const insetsStyle = { paddingBottom: Math.max(insets.bottom, Spacing.Regular16) }

  const goToLanguageSetting = () => {
    navigate(Screens.Language, { nextScreen: route.name })
  }

  const goToLocalCurrencySetting = () => {
    navigate(Screens.SelectLocalCurrency)
  }

  const handleHapticFeedbackToggle = (value: boolean) => {
    dispatch(hapticFeedbackSet(value))
    AppAnalytics.track(SettingsEvents.settings_haptic_feedback, {
      enabled: value,
    })
  }

  return (
    <SafeAreaView edges={['top']}>
      <CustomHeader left={<BackButton />} title={t('preferences')} style={styles.header} />
      <ScrollView style={insetsStyle}>
        <SettingsItemTextValue
          testID="PreferencesSubmenu/Language"
          title={t('languageSettings')}
          value={locales[currentLanguage ?? '']?.name ?? t('unknown')}
          onPress={goToLanguageSetting}
          showChevron
        />
        <SettingsItemTextValue
          title={t('localCurrencySetting')}
          testID="PreferencesSubmenu/ChangeCurrency"
          value={preferredCurrencyCode}
          onPress={goToLocalCurrencySetting}
          showChevron
        />
        <SettingsItemSwitch
          title={t('hapticFeedback')}
          testID="PreferencesSubmenu/HapticToggle"
          value={hapticFeedbackEnabled}
          onValueChange={handleHapticFeedbackToggle}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: variables.contentPadding,
  },
})

export default PreferencesSubmenu
