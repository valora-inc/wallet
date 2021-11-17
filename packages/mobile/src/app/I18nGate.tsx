import locales from 'locales'
import React, { useEffect } from 'react'
import { useAsync } from 'react-async-hook'
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
  const dispatch = useDispatch()
  const language = useSelector(currentLanguageSelector)
  const bestLanguage = findBestAvailableLanguage(Object.keys(locales))?.languageTag

  const i18nInitResult = useAsync(async () => {
    await initI18n(language || bestLanguage || DEFAULT_APP_LANGUAGE)
    if (!language && bestLanguage) {
      dispatch(setLanguage(bestLanguage))
    }
    return true
  }, [])

  useEffect(() => {
    if (i18nInitResult.error) {
      Logger.error('i18n', 'Failed init i18n', i18nInitResult.error)
      navigateToError('appInitFailed')
    }
  }, [i18nInitResult.error])

  return (
    <>
      {i18nInitResult.loading && loading}
      {i18nInitResult.result && children}
    </>
  )
}

export default I18nGate
