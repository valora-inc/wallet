import locales from 'locales'
import { useAsync } from 'react-async-hook'
import { findBestAvailableLanguage } from 'react-native-localize'
import { useSelector } from 'react-redux'
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

const I18nGate = ({ loading, children }: Props) => {
  const changelanguage = useChangeLanguage()
  const allowOtaTranslations = useSelector(allowOtaTranslationsSelector)
  const otaTranslationsAppVersion = useSelector(otaTranslationsAppVersionSelector)
  const language = useSelector(currentLanguageSelector)
  const bestLanguage = findBestAvailableLanguage(Object.keys(locales))?.languageTag

  const i18nInitResult = useAsync(
    async () => {
      await initI18n(
        language || bestLanguage || DEFAULT_APP_LANGUAGE,
        allowOtaTranslations,
        otaTranslationsAppVersion
      )
      if (!language && bestLanguage) {
        await changelanguage(bestLanguage)
      }
    },
    [],
    {
      onError: (error) => {
        Logger.error('i18n', 'Failed init i18n', error)
        navigateToError('appInitFailed', error)
      },
    }
  )

  // type assertion here because https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44572
  return i18nInitResult.loading ? (loading as JSX.Element) : (children as JSX.Element)
}

export default I18nGate
