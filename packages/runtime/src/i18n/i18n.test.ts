import i18next from 'i18next'

jest.mock('react-native-fs', () => {
  return {
    exists: jest.fn().mockResolvedValue(true),
    readFile: jest.fn().mockResolvedValue('{"en-US":{"someKey":"Hello!"}}'),
  }
})

let i18n: typeof i18next
let enLoaded = false
let esLoaded = false
let ptLoaded = false

// Disable __DEV__ so OTA translations override bundled translations
// @ts-ignore
global.__DEV__ = false

const handleSetupTests = () => {
  enLoaded = false
  esLoaded = false
  ptLoaded = false

  jest.resetModules()

  jest.mock('../../locales/base/translation.json', () => {
    enLoaded = true
    return { someKey: 'Hi!', someExtraKey: 'someExtraValue' }
  })

  jest.mock('../../locales/es-419/translation.json', () => {
    esLoaded = true
    return { someKey: '¡Hola!' }
  })

  jest.mock('../../locales/pt-BR/translation.json', () => {
    ptLoaded = true
    return { someKey: 'Oi!' }
  })

  jest.unmock('src/i18n')
}

describe('i18n', () => {
  describe('load from bundled translations', () => {
    beforeEach(async () => {
      handleSetupTests()

      const I18n = require('src/i18n')
      i18n = I18n.default
      await I18n.initI18n('en-US', false, '0')
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
      expect(enLoaded).toBe(true) // i18n was initialised with en-US in the beforeEach
      expect(esLoaded).toBe(true)
      expect(ptLoaded).toBe(false)

      // This will cause the default (fallback) language to be loaded
      expect(i18n.t('someMissingKey')).toEqual('someMissingKey')
      expect(enLoaded).toBe(true)
      expect(esLoaded).toBe(true)
      expect(ptLoaded).toBe(false)
    })
  })

  describe('load from cached translations', () => {
    beforeEach(async () => {
      handleSetupTests()

      const I18n = require('src/i18n')
      i18n = I18n.default
      await I18n.initI18n('en-US', true, '0.0.1')
    })

    it('displays the cached translation for default language (en-US)', () => {
      expect(i18n.t('someKey')).toEqual('Hello!')
      expect(enLoaded).toBe(true)
      expect(esLoaded).toBe(false)
      expect(ptLoaded).toBe(false)
    })

    it('displays the bundled translation if cached translation is for a different language', async () => {
      await i18n.changeLanguage('pt-BR')
      expect(i18n.t('someKey')).toEqual('Oi!')
      expect(enLoaded).toBe(true) // i18n was initialised with en-US in the beforeEach
      expect(esLoaded).toBe(false)
      expect(ptLoaded).toBe(true)
    })

    it('displays bundled translation values if they are missing from cached translations', () => {
      // Note that this is a valid scenario for development
      expect(i18n.t('someKey')).toEqual('Hello!')
      expect(i18n.t('someExtraKey')).toEqual('someExtraValue')
    })
  })
})
