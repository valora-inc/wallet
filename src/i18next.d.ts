// import the original type declarations
import 'i18next'
import Resources from './i18n/i18next-resources.d.ts'

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: Resources
    interpolation: {
      defaultVariables: {
        appName: string
        tosLink: string
      }
    }
  }
}
