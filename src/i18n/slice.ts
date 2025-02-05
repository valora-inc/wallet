import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

interface State {
  language: string | null
  otaTranslationsLastUpdate: number
  otaTranslationsAppVersion: string
  otaTranslationsLanguage: string
}

const initialState: State = {
  language: null,
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
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'i18n'),
    }))
  },
})

export const { otaTranslationsUpdated, setLanguage } = slice.actions

export default slice.reducer
