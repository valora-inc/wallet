interface Locales {
  [key: string]:
    | {
        name: string
        strings: any
        dateFns: Locale
      }
    | undefined
}

const locales: Locales = {
  'en-US': {
    name: 'English',
    get strings() {
      return {
        translation: require('./en-US/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/en-US')
    },
  },
  'es-419': {
    name: 'Español',
    get strings() {
      return {
        translation: require('./es-419/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/es')
    },
  },
  'pt-BR': {
    name: 'Português',
    get strings() {
      return {
        translation: require('./pt-BR/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/pt-BR')
    },
  },
  de: {
    name: 'Deutsch',
    get strings() {
      return {
        translation: require('./de/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/de')
    },
  },
}

export default locales

export const localesList = Object.entries(locales).map(([key, value]) => {
  return { code: key, name: value!.name }
})
