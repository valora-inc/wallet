import locales from 'locales'
import { useEffect, useState } from 'react'
import { findBestAvailableLanguage } from 'react-native-localize'
import { useDispatch, useSelector } from 'react-redux'
import { setLanguage } from 'src/app/actions'
import { currentLanguageSelector } from 'src/app/reducers'
import { DEFAULT_APP_LANGUAGE } from 'src/config'
import { initI18n } from 'src/i18n'
import { navigateToError } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'

interface Props {
  loading: React.ReactNode
  children: React.ReactNode
}

const I18nGate = ({ loading, children }: Props) => {
  const [isInitialised, setIsInitialised] = useState(false)
  const [initFailure, setInitFailure] = useState(false)
  const dispatch = useDispatch()
  const language = useSelector(currentLanguageSelector)
  const bestLanguage = findBestAvailableLanguage(Object.keys(locales))?.languageTag

  useEffect(() => {
    const i18nInit = async () => {
      try {
        await initI18n(language || bestLanguage || DEFAULT_APP_LANGUAGE)
        if (!language && bestLanguage) {
          dispatch(setLanguage(bestLanguage))
        }
        setIsInitialised(true)
      } catch (reason) {
        Logger.error('i18n', 'Failed init i18n', reason)
        setInitFailure(true)
        navigateToError('appInitFailed')
      }
    }
    void i18nInit()
  }, [])

  // type assertion here because https://github.com/DefinitelyTyped/DefinitelyTyped/issues/44572
  return isInitialised || initFailure ? (children as JSX.Element) : (loading as JSX.Element)
}

export default I18nGate
