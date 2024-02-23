import locales from 'locales'
import React, { useEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { Dimensions } from 'react-native'
import { findBestAvailableLanguage } from 'react-native-localize'
import { useDispatch, useSelector } from 'react-redux'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { appMounted, appUnmounted } from 'src/app/actions'
import { isE2EEnv } from 'src/config'
import i18n from 'src/i18n'
import { currentLanguageSelector } from 'src/i18n/selectors'
import useChangeLanguage from 'src/i18n/useChangeLanguage'
import { navigateToError } from 'src/navigator/NavigationService'
import { waitUntilSagasFinishLoading } from 'src/redux/sagas'
import Logger from 'src/utils/Logger'

const TAG = 'AppInitGate'

interface Props {
  reactLoadTime: number
  appStartedMillis: number
  children: React.ReactNode
}

const AppInitGate = ({ appStartedMillis, reactLoadTime, children }: Props) => {
  const changelanguage = useChangeLanguage()
  const dispatch = useDispatch()

  const language = useSelector(currentLanguageSelector)
  const bestLanguage = !isE2EEnv
    ? findBestAvailableLanguage(Object.keys(locales))?.languageTag
    : 'en-US'

  useEffect(() => {
    return () => {
      dispatch(appUnmounted())
    }
  }, [])

  const initResult = useAsync(
    async () => {
      Logger.debug(TAG, 'Starting AppInitGate init')
      await waitUntilSagasFinishLoading()

      if (!language && bestLanguage) {
        await changelanguage(bestLanguage)
      }

      const reactLoadDuration = (reactLoadTime - appStartedMillis) / 1000
      const appLoadDuration = (Date.now() - appStartedMillis) / 1000
      Logger.debug('TAG', `reactLoad: ${reactLoadDuration} appLoad: ${appLoadDuration}`)

      const { width, height } = Dimensions.get('window')
      ValoraAnalytics.startSession(AppEvents.app_launched, {
        deviceHeight: height,
        deviceWidth: width,
        reactLoadDuration,
        appLoadDuration,
        language: i18n.language || language,
      })

      Logger.debug(TAG, 'AppInitGate init completed')
      dispatch(appMounted())
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
  return initResult.loading ? null : (children as JSX.Element)
}

export default AppInitGate
