import * as RNLocalize from 'react-native-localize'
import { createSelector } from 'reselect'
import i18n from 'src/i18n'
import { RecipientType } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { Countries } from 'src/utils/Countries'
import { getCountryFeatures } from 'src/utils/countryFeatures'
import { currentAccountSelector } from 'src/web3/selectors'

const inferCountryCode = () => {
  const localizedCountry = new Countries(i18n.language).getCountryByCodeAlpha2(
    RNLocalize.getCountry()
  )
  if (localizedCountry && !getCountryFeatures(localizedCountry.alpha2).SANCTIONED_COUNTRY) {
    return localizedCountry.countryCallingCode
  }
  return null
}

export const devModeSelector = (state: RootState) => state.account.devModeActive
export const nameSelector = (state: RootState) => state.account.name
export const e164NumberSelector = (state: RootState) => state.account.e164PhoneNumber
export const defaultCountryCodeSelector = createSelector(
  (state: RootState) => state.account.defaultCountryCode,
  (defaultCountryCode) => {
    return defaultCountryCode || inferCountryCode()
  }
)
export const pincodeTypeSelector = (state: RootState) => state.account.pincodeType

export const currentUserRecipientSelector = createSelector(
  [currentAccountSelector, nameSelector],
  (account, name) => {
    return {
      address: account!,
      name: name ?? undefined,
      recipientType: RecipientType.Address,
    }
  }
)
export const recoveringFromStoreWipeSelector = (state: RootState) =>
  state.account.recoveringFromStoreWipe ?? false
export const accountToRecoverSelector = (state: RootState) =>
  state.account.accountToRecoverFromStoreWipe

export const backupCompletedSelector = (state: RootState) => state.account.backupCompleted

export const choseToRestoreAccountSelector = (state: RootState) =>
  state.account.choseToRestoreAccount

export const accountCreationTimeSelector = (state: RootState) => state.account.accountCreationTime

export const celoEducationCompletedSelector = (state: RootState) =>
  state.account.celoEducationCompleted

export const startOnboardingTimeSelector = (state: RootState) => state.account.startOnboardingTime
export const recoveryPhraseInOnboardingStatusSelector = (state: RootState) =>
  state.account.recoveryPhraseInOnboardingStatus

export const cloudBackupCompletedSelector = (state: RootState) => state.account.cloudBackupCompleted
