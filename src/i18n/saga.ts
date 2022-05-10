import OtaClient from '@crowdin/ota-client'
import i18n from 'i18next'
import _ from 'lodash'
import DeviceInfo from 'react-native-device-info'
import { call, put, select, spawn, takeLatest } from 'redux-saga/effects'
import { Actions as AppActions } from 'src/app/actions'
import { CROWDIN_DISTRIBUTION_HASH } from 'src/config'
import { saveOtaTranslations } from 'src/i18n/otaTranslations'
import {
  allowOtaTranslationsSelector,
  currentLanguageSelector,
  otaTranslationsAppVersionSelector,
  otaTranslationsLanguageSelector,
  otaTranslationsLastUpdateSelector,
} from 'src/i18n/selectors'
import { otaTranslationsUpdated, setLanguage } from 'src/i18n/slice'
import Logger from 'src/utils/Logger'

const TAG = 'i18n/saga'
const otaClient = new OtaClient(CROWDIN_DISTRIBUTION_HASH)

export function* handleFetchOtaTranslations() {
  const allowOtaTranslations = yield select(allowOtaTranslationsSelector)
  if (allowOtaTranslations) {
    try {
      const lastFetchLanguage = yield select(otaTranslationsLanguageSelector)
      const currentLanguage = yield select(currentLanguageSelector)
      const lastFetchTime = yield select(otaTranslationsLastUpdateSelector)
      const timestamp = yield call([otaClient, otaClient.getManifestTimestamp])
      const lastFetchAppVersion = yield select(otaTranslationsAppVersionSelector)

      if (
        lastFetchLanguage !== currentLanguage ||
        lastFetchTime !== timestamp ||
        DeviceInfo.getVersion() !== lastFetchAppVersion
      ) {
        const languageMappings = yield call([otaClient, otaClient.getLanguageMappings])
        const customMappedLanguage = _.findKey(languageMappings, { locale: currentLanguage })

        const translations = yield call(
          [otaClient, otaClient.getStringsByLocale],
          undefined,
          customMappedLanguage || currentLanguage
        )
        i18n.addResourceBundle(currentLanguage, 'translation', translations, true, true)

        yield call(saveOtaTranslations, { [currentLanguage]: translations })
        yield put(
          otaTranslationsUpdated({
            otaTranslationsLastUpdate: timestamp,
            otaTranslationsAppVersion: DeviceInfo.getVersion(),
            otaTranslationsLanguage: currentLanguage,
          })
        )
      }
    } catch (error) {
      Logger.error(`${TAG}@handleFetchOtaTranslations`, 'Failed to fetch OTA translations', error)
    }
  }
}

export function* watchOtaTranslations() {
  yield takeLatest(
    [setLanguage.type, AppActions.UPDATE_REMOTE_CONFIG_VALUES],
    handleFetchOtaTranslations
  )
}

export function* i18nSaga() {
  yield spawn(watchOtaTranslations)
}
