import locales from 'locales'
import { useEffect, useState } from 'react'
import { findBestAvailableLanguage } from 'react-native-localize'
import { useDispatch, useSelector } from 'react-redux'
import { setLanguage } from 'src/app/actions'
import { currentLanguageSelector } from 'src/app/reducers'
import { allowOtaTranslationsSelector } from 'src/app/selectors'
import { DEFAULT_APP_LANGUAGE } from 'src/config'
import { initI18n } from 'src/i18n'
import Logger from 'src/utils/Logger'

interface Props {
  fallback: JSX.Element
  children: JSX.Element
}

const I18nGate = ({ fallback, children }: Props) => {
  const [isInitialised, setIsInitialised] = useState(false)
  const dispatch = useDispatch()
  const allowOtaTranslations = useSelector(allowOtaTranslationsSelector)
  const language = useSelector(currentLanguageSelector)
  const bestLanguage = findBestAvailableLanguage(Object.keys(locales))?.languageTag

  useEffect(() => {
    const i18nInit = async () => {
      try {
        await initI18n(language || bestLanguage || DEFAULT_APP_LANGUAGE, allowOtaTranslations)
        if (!language && bestLanguage) {
          dispatch(setLanguage(bestLanguage))
        }
        setIsInitialised(true)
      } catch (reason) {
        Logger.error('i18n', 'Failed init i18n', reason)
      }
    }
    void i18nInit()
  }, [allowOtaTranslations])

  return isInitialised ? children : fallback
}

export default I18nGate
