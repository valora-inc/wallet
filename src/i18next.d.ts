// import the original type declarations
import 'i18next'
import base from '../locales/base/translation.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'base'
    resources: {
      base: typeof base
    }
  }
}
