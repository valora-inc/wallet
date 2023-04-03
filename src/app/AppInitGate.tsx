import locales from 'locales'
import { useAsync } from 'react-async-hook'
import { findBestAvailableLanguage } from 'react-native-localize'
import { useSelector } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { DEFAULT_APP_LANGUAGE } from 'src/config'
import { initI18n } from 'src/i18n'
import {
  allowOtaTranslationsSelector,
  currentLanguageSelector,
  otaTranslationsAppVersionSelector,
} from 'src/i18n/selectors'
import useChangeLanguage from 'src/i18n/useChangeLanguage'
import { navigateToError } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'

interface Props {
  loading: React.ReactNode
  children: React.ReactNode
}

const AppInitGate = ({ loading, children }: Props) => {
  const changelanguage = useChangeLanguage()
  const allowOtaTranslations = useSelector(allowOtaTranslationsSelector)
  const otaTranslationsAppVersion = useSelector(otaTranslationsAppVersionSelector)
  const language = useSelector(currentLanguageSelector)
  const bestLanguage = findBestAvailableLanguage(Object.keys(locales))?.languageTag

  const i18nInitializer = async () => {
    Logger.debug('i18n', 'Starting i18n init')
    await initI18n(
      language || bestLanguage || DEFAULT_APP_LANGUAGE,
      allowOtaTranslations,
      otaTranslationsAppVersion
    )
    if (!language && bestLanguage) {
      await changelanguage(bestLanguage)
    }
    Logger.debug('i18n', 'i18n init completed')
  }

  const analyticsInitializer = async () => {
    Logger.debug('analytics', 'Starting analytics init')
    await ValoraAnalytics.init()
    Logger.debug('analytics', 'analytics init completed')
  }

  const initResult = useAsync(
    async () => {
      Logger.debug('AppInitGate', 'Starting init')
      await Promise.all([i18nInitializer(), analyticsInitializer()])
      Logger.debug('AppInitGate', 'init completed')
    },
    [],
    {
      onError: (error) => {
        Logger.error('AppInitGate', 'Failed i18n', error)
        navigateToError('appInitFailed', error)
      },
    }
  )

  // type assertion here because https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44572
  return initResult.loading ? (loading as JSX.Element) : (children as JSX.Element)
}

export default AppInitGate
