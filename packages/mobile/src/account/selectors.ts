import { Countries } from '@celo/utils/lib/countries'
import * as RNLocalize from 'react-native-localize'
import i18n from 'src/i18n'
import { RootState } from 'src/redux/reducers'

const inferCountryCode = () => {
  const localizedCountry = new Countries(i18n.language).getCountryByCodeAlpha2(
    RNLocalize.getCountry()
  )
  return localizedCountry?.countryCallingCode ?? null
}

export const getE164PhoneNumber = (state: RootState) => {
  return state.account.e164PhoneNumber
}
export const devModeSelector = (state: RootState) => state.account.devModeActive
export const nameSelector = (state: RootState) => state.account.name
export const e164NumberSelector = (state: RootState) => state.account.e164PhoneNumber
export const pictureSelector = (state: RootState) => state.account.pictureUri
export const defaultCountryCodeSelector = (state: RootState) =>
  state.account.defaultCountryCode || inferCountryCode()
export const userContactDetailsSelector = (state: RootState) => state.account.contactDetails
export const pincodeTypeSelector = (state: RootState) => state.account.pincodeType
export const promptFornoIfNeededSelector = (state: RootState) => state.account.promptFornoIfNeeded
export const cUsdDailyLimitSelector = (state: RootState) => state.account.dailyLimitCusd
