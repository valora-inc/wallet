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

const TAG = 'AppInitGate'

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
    await initI18n(
      language || bestLanguage || DEFAULT_APP_LANGUAGE,
      allowOtaTranslations,
      otaTranslationsAppVersion
    )
    if (!language && bestLanguage) {
      await changelanguage(bestLanguage)
    }
  }

  const initResult = useAsync(
    async () => {
      Logger.debug(TAG, 'Starting init')
      await Promise.all([i18nInitializer(), ValoraAnalytics.init()])
      Logger.debug(TAG, 'init completed')
    },
    [],
    {
      onError: (error) => {
        Logger.error(TAG, 'Failed init', error)
        navigateToError('appInitFailed', error)
      },
    }
  )

  // type assertion here because https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44572
  return initResult.loading ? (loading as JSX.Element) : (children as JSX.Element)
}

export default AppInitGate
