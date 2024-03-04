import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

interface State {
  language: string | null
  allowOtaTranslations: boolean
  otaTranslationsLastUpdate: number
  otaTranslationsAppVersion: string
  otaTranslationsLanguage: string
}

const initialState: State = {
  language: null,
  allowOtaTranslations: REMOTE_CONFIG_VALUES_DEFAULTS.allowOtaTranslations,
  otaTranslationsLastUpdate: 0,
  otaTranslationsAppVersion: '0',
  otaTranslationsLanguage: '',
}

interface OtaTranslationsUpdatedAction {
  otaTranslationsLastUpdate: number
  otaTranslationsAppVersion: string
  otaTranslationsLanguage: string
}

export const slice = createSlice({
  name: 'i18n',
  initialState,
  reducers: {
    otaTranslationsUpdated: (state, action: PayloadAction<OtaTranslationsUpdatedAction>) => ({
      ...state,
      ...action.payload,
    }),
    setLanguage: (state, action: PayloadAction<State['language']>) => {
      state.language = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        AppActions.UPDATE_REMOTE_CONFIG_VALUES,
        (state, action: UpdateConfigValuesAction) => {
          state.allowOtaTranslations = action.configValues.allowOtaTranslations
        }
      )
      .addCase(AppActions.RESET_APP_OPENED_STATE, (state) => {
        state.language = null
      })
      .addCase(REHYDRATE, (state, action: RehydrateAction) => ({
        ...state,
        ...getRehydratePayload(action, 'i18n'),
      }))
  },
})

export const { otaTranslationsUpdated, setLanguage } = slice.actions

export default slice.reducer
