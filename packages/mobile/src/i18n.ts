import locales from '@celo/mobile/locales'
import hoistStatics from 'hoist-non-react-statics'
import i18n, { Resource } from 'i18next'
import {
  initReactI18next,
  WithTranslation,
  withTranslation as withTranslationI18Next,
} from 'react-i18next'
import * as RNFS from 'react-native-fs'
import { APP_NAME, DEFAULT_APP_LANGUAGE, OTA_TRANSLATIONS_FILE, TOS_LINK } from 'src/config'

const TOS_LINK_DISPLAY = TOS_LINK.replace(/^https?:\/\//i, '')

export enum Namespaces {
  accountScreen10 = 'accountScreen10',
  backupKeyFlow6 = 'backupKeyFlow6',
  exchangeFlow9 = 'exchangeFlow9',
  global = 'global',
  index = 'index',
  inviteFlow11 = 'inviteFlow11',
  goldEducation = 'goldEducation',
  nuxNamePin1 = 'nuxNamePin1',
  nuxVerification2 = 'nuxVerification2',
  receiveFlow8 = 'receiveFlow8',
  sendFlow7 = 'sendFlow7',
  paymentRequestFlow = 'paymentRequestFlow',
  walletFlow5 = 'walletFlow5',
  dappkit = 'dappkit',
  onboarding = 'onboarding',
  fiatExchangeFlow = 'fiatExchangeFlow',
  consumerIncentives = 'consumerIncentives',
  walletConnect = 'walletConnect',
}

async function getAvailableResources() {
  let cachedTranslations: Resource = {}
  if (await RNFS.exists(OTA_TRANSLATIONS_FILE)) {
    cachedTranslations = JSON.parse(await RNFS.readFile(OTA_TRANSLATIONS_FILE))
  }

  const resources: Resource = {}
  for (const [lng, value] of Object.entries(locales)) {
    // use only the global file for now
    const global = cachedTranslations[lng] || value!.strings.global
    Object.defineProperty(resources, lng, {
      get: () => ({
        ...value!.strings,
        global,
      }),
      enumerable: true,
    })
  }

  return resources
}

export const initI18n = async (lng: string) => {
  const resources = await getAvailableResources()

  await i18n.use(initReactI18next).init({
    fallbackLng: {
      default: [DEFAULT_APP_LANGUAGE],
      'es-US': ['es-LA'],
    },
    lng,
    resources,
    ns: ['common', ...Object.keys(Namespaces)],
    defaultNS: 'common',
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
export const withTranslation = <P extends WithTranslation>(namespace: Namespaces) => <
  C extends React.ComponentType<P>
>(
  component: C
) => hoistStatics(withTranslationI18Next(namespace)(component), component)

export default i18n
