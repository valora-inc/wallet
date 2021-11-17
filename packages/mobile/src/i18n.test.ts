import i18next from 'i18next'
import 'react-native'

let i18n: typeof i18next
let enLoaded = false
let esLoaded = false
let ptLoaded = false

describe('i18n', () => {
  beforeEach(() => {
    enLoaded = false
    esLoaded = false
    ptLoaded = false

    jest.resetModules()

    jest.mock('../locales/en-US', () => {
      enLoaded = true
      return { default: { translation: { someKey: 'Hi!' } } }
    })

    jest.mock('../locales/es-419', () => {
      esLoaded = true
      return { default: { translation: { someKey: '¡Hola!' } } }
    })

    jest.mock('../locales/pt-BR', () => {
      ptLoaded = true
      return { default: { translation: { someKey: 'Oi!' } } }
    })

    jest.unmock('src/i18n')
    i18n = require('src/i18n').default
  })

  it('only loads the default language (en-US)', () => {
    expect(i18n.t('someKey')).toEqual('Hi!')
    expect(enLoaded).toBe(true)
    expect(esLoaded).toBe(false)
    expect(ptLoaded).toBe(false)
  })

  it('only loads the selected language, but loads the default language when accessing a missing key', async () => {
    await i18n.changeLanguage('es-419')
    expect(i18n.t('someKey')).toEqual('¡Hola!')
    expect(enLoaded).toBe(false)
    expect(esLoaded).toBe(true)
    expect(ptLoaded).toBe(false)

    // This will cause the default (fallback) language to be loaded
    expect(i18n.t('someMissingKey')).toEqual('someMissingKey')
    expect(enLoaded).toBe(true)
    expect(esLoaded).toBe(true)
    expect(ptLoaded).toBe(false)
  })
})
