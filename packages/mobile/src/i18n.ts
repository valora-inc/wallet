import locales from '@celo/mobile/locales'
import hoistStatics from 'hoist-non-react-statics'
import i18n from 'i18next'
import {
  initReactI18next,
  WithTranslation,
  withTranslation as withTranslationI18Next,
} from 'react-i18next'
import { APP_NAME, DEFAULT_APP_LANGUAGE, TOS_LINK } from 'src/config'

const TOS_LINK_DISPLAY = TOS_LINK.replace(/^https?:\/\//i, '')

export enum Namespaces {
  translation = 'translation',
  index = 'index',
}

function getAvailableResources() {
  const resources = {}
  for (const [key, value] of Object.entries(locales)) {
    Object.defineProperty(resources, key, {
      get: () => value!.strings,
      enumerable: true,
    })
  }
  return resources
}

const availableResources = getAvailableResources()

export function initI18n(language: string) {
  return i18n.use(initReactI18next).init({
    fallbackLng: {
      default: [DEFAULT_APP_LANGUAGE],
      'es-US': ['es-LA'],
    },
    lng: language,
    resources: availableResources,
    ns: ['translation', ...Object.keys(Namespaces)],
    defaultNS: 'translation',
    // Only enable for debugging as it forces evaluation of all our lazy loaded locales
    // and prints out all strings when initializing
    debug: false,
    interpolation: {
      escapeValue: false,
      defaultVariables: { appName: APP_NAME, tosLink: TOS_LINK_DISPLAY },
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
export const withTranslation = <P extends WithTranslation>(namespace?: Namespaces) => <
  C extends React.ComponentType<P>
>(
  component: C
) => hoistStatics(withTranslationI18Next(namespace)(component), component)

export default i18n
