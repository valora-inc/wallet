import { RootState } from 'src/redux/reducers'

export const currentLanguageSelector = (state: RootState) => state.i18n.language

export const allowOtaTranslationsSelector = (state: RootState) => state.i18n.allowOtaTranslations

export const otaTranslationsLastUpdateSelector = (state: RootState) =>
  state.i18n.otaTranslationsLastUpdate

export const otaTranslationsAppVersionSelector = (state: RootState) =>
  state.i18n.otaTranslationsAppVersion

export const otaTranslationsLanguageSelector = (state: RootState) =>
  state.i18n.otaTranslationsLanguage
