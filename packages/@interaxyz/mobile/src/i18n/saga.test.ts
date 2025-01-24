import i18n from 'i18next'
import DeviceInfo from 'react-native-device-info'
import { expectSaga } from 'redux-saga-test-plan'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { saveOtaTranslations } from 'src/i18n/otaTranslations'
import { handleFetchOtaTranslations } from 'src/i18n/saga'
import {
  allowOtaTranslationsSelector,
  currentLanguageSelector,
  otaTranslationsAppVersionSelector,
  otaTranslationsLanguageSelector,
  otaTranslationsLastUpdateSelector,
} from 'src/i18n/selectors'
import { otaTranslationsUpdated } from 'src/i18n/slice'

jest.mock('@crowdin/ota-client', () => {
  return function () {
    return {
      getManifestTimestamp: jest.fn(() => 123456),
      getLanguageMappings: jest.fn(),
      getStringsByLocale: jest.fn(() => ({
        someLang: { someNamespace: { someKey: 'someValue ' } },
      })),
    }
  }
})

jest.mock('i18next', () => ({
  addResourceBundle: jest.fn(),
}))

const MockedI18n = jest.mocked(i18n)

describe('i18n sagas', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('handles fetching over the air translations', async () => {
    const translations = { someLang: { someNamespace: { someKey: 'someValue ' } } }
    const timestamp = 123456
    const appVersion = '1.0.0'
    const mockedVersion = DeviceInfo.getVersion as jest.MockedFunction<typeof DeviceInfo.getVersion>
    mockedVersion.mockImplementation(() => appVersion)
    const defaultProviders: (EffectProviders | StaticProvider)[] = [
      [select(allowOtaTranslationsSelector), true],
      [select(otaTranslationsAppVersionSelector), appVersion],
      [select(otaTranslationsLanguageSelector), 'en-US'],
      [select(currentLanguageSelector), 'en-US'],
      [select(otaTranslationsLastUpdateSelector), timestamp],
      [call(saveOtaTranslations, { 'en-US': translations }), null],
    ]

    // last fetched translations are outdated
    await expectSaga(handleFetchOtaTranslations)
      .provide([[select(otaTranslationsLastUpdateSelector), 0], ...defaultProviders])
      .put(
        otaTranslationsUpdated({
          otaTranslationsLastUpdate: timestamp,
          otaTranslationsAppVersion: appVersion,
          otaTranslationsLanguage: 'en-US',
        })
      )
      .run()

    // last fetched translations are for a different language
    await expectSaga(handleFetchOtaTranslations)
      .provide([
        [select(currentLanguageSelector), 'de'],
        [call(saveOtaTranslations, { de: translations }), null],
        ...defaultProviders,
      ])
      .put(
        otaTranslationsUpdated({
          otaTranslationsLastUpdate: timestamp,
          otaTranslationsAppVersion: appVersion,
          otaTranslationsLanguage: 'de',
        })
      )
      .run()

    // last fetched translations are for a previous app version
    await expectSaga(handleFetchOtaTranslations)
      .provide([[select(otaTranslationsAppVersionSelector), '0.9.0'], ...defaultProviders])
      .put(
        otaTranslationsUpdated({
          otaTranslationsLastUpdate: timestamp,
          otaTranslationsAppVersion: appVersion,
          otaTranslationsLanguage: 'en-US',
        })
      )
      .run()

    expect(MockedI18n.addResourceBundle).toHaveBeenCalledTimes(3)
  })
})
