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
        translation: require('./base/translation.json'),
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
  'ru-RU': {
    name: 'Pyccкий',
    get strings() {
      return {
        translation: require('./ru-RU/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/ru')
    },
  },
  'fr-FR': {
    name: 'Français',
    get strings() {
      return {
        translation: require('./fr-FR/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/fr')
    },
  },
  'it-IT': {
    name: 'Italiano',
    get strings() {
      return {
        translation: require('./it-IT/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/it')
    },
  },
  'uk-UA': {
    name: 'Українська',
    get strings() {
      return {
        translation: require('./uk-UA/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/uk')
    },
  },
  'tr-TR': {
    name: 'Türkçe',
    get strings() {
      return {
        translation: require('./tr-TR/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/tr')
    },
  },
  'pl-PL': {
    name: 'Polski',
    get strings() {
      return {
        translation: require('./pl-PL/translation.json'),
      }
    },
    get dateFns() {
      return require('date-fns/locale/pl')
    },
  },
}

export default locales

export const localesList = Object.entries(locales).map(([key, value]) => {
  return { code: key, name: value!.name }
})
