import hoistStatics from 'hoist-non-react-statics'
import i18n, { Resource, ResourceLanguage } from 'i18next'
import _ from 'lodash'
import {
  WithTranslation,
  initReactI18next,
  withTranslation as withTranslationI18Next,
} from 'react-i18next'
import DeviceInfo from 'react-native-device-info'
import { APP_NAME, DEFAULT_APP_LANGUAGE } from 'src/config'
import { getOtaTranslations } from 'src/i18n/otaTranslations'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import locales from '../../locales'

function getAvailableResources(cachedTranslations: Resource) {
  const resources: Resource = {}
  for (const [language, value] of Object.entries(locales)) {
    let translation: ResourceLanguage
    Object.defineProperty(resources, language, {
      get: () => {
        if (!translation) {
          // prioritise bundled translations over OTA translations in dev mode
          // so that copy updates can be surfaced
          translation = __DEV__
            ? _.merge(cachedTranslations[language], value!.strings.translation)
            : _.merge(value!.strings.translation, cachedTranslations[language])
        }
        return { translation }
      },
      enumerable: true,
    })
  }
  return resources
}
export async function initI18n(
  language: string,
  allowOtaTranslations: boolean,
  otaTranslationsAppVersion: string
) {
  let cachedTranslations: Resource = {}
  if (allowOtaTranslations && DeviceInfo.getVersion() === otaTranslationsAppVersion) {
    cachedTranslations = await getOtaTranslations()
  }
  const resources = getAvailableResources(cachedTranslations)
  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])

  return i18n.use(initReactI18next).init({
    fallbackLng: {
      default: [DEFAULT_APP_LANGUAGE],
      'es-US': ['es-LA'],
    },
    lng: language,
    resources,
    // Only enable for debugging as it forces evaluation of all our lazy loaded locales
    // and prints out all strings when initializing
    debug: false,
    interpolation: {
      escapeValue: false,
      defaultVariables: {
        appName: APP_NAME,
        tosLink: links.tos.replace(/^https?:\/\//i, ''),
      },
    },
  })
}

// Disabling this for now as we have our own language selection within the app
// and this will change the displayed language only for the current session
// when the device locale is changed outside of the app.
// RNLocalize.addEventListener('change', () => {
//   i18n
//     .changeLanguage(getLanguage())
//     .catch((reason: any) => Logger.error(TAG, 'Failed to change i18n language', reason))
// })

// Create HOC wrapper that hoists statics
// https://react.i18next.com/latest/withtranslation-hoc#hoist-non-react-statics
export const withTranslation =
  <P extends WithTranslation>() =>
  <C extends React.ComponentType<P>>(component: C) =>
    hoistStatics(withTranslationI18Next()(component), component)

export default i18n
