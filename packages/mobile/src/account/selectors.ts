import { Countries } from '@celo/utils/lib/countries'
import * as RNLocalize from 'react-native-localize'
import { createSelector } from 'reselect'
import i18n from 'src/i18n'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { RootState } from 'src/redux/reducers'
import {
  currentAccountSelector,
  dataEncryptionKeySelector,
  mtwAddressSelector,
} from 'src/web3/selectors'

const inferCountryCode = () => {
  const localizedCountry = new Countries(i18n.language).getCountryByCodeAlpha2(
    RNLocalize.getCountry()
  )
  return localizedCountry?.countryCallingCode ?? null
}

export const devModeSelector = (state: RootState) => state.account.devModeActive
export const nameSelector = (state: RootState) => state.account.name
export const e164NumberSelector = (state: RootState) => state.account.e164PhoneNumber
export const pictureSelector = (state: RootState) => state.account.pictureUri
export const defaultCountryCodeSelector = createSelector(
  (state: RootState) => state.account.defaultCountryCode,
  (defaultCountryCode) => defaultCountryCode || inferCountryCode()
)
export const userContactDetailsSelector = (state: RootState) => state.account.contactDetails
export const pincodeTypeSelector = (state: RootState) => state.account.pincodeType
export const promptFornoIfNeededSelector = (state: RootState) => state.account.promptFornoIfNeeded
export const isProfileUploadedSelector = (state: RootState) => state.account.profileUploaded
export const cUsdDailyLimitSelector = (state: RootState) => state.account.dailyLimitCusd

export const currentUserRecipientSelector = createSelector(
  [currentAccountSelector, nameSelector, pictureSelector, userContactDetailsSelector],
  (account, name, picture, contactDetails) => {
    return {
      address: account!,
      name: name ?? undefined,
      thumbnailPath: picture ?? contactDetails.thumbnailPath ?? undefined,
    }
  }
)
export const dailyLimitRequestStatusSelector = (state: RootState) =>
  state.account.dailyLimitRequestStatus
export const recoveringFromStoreWipeSelector = (state: RootState) =>
  state.account.recoveringFromStoreWipe ?? false
export const accountToRecoverSelector = (state: RootState) =>
  state.account.accountToRecoverFromStoreWipe
export const kycStatusSelector = (state: RootState) => state.account.kycStatus
export const backupCompletedSelector = (state: RootState) => state.account.backupCompleted

export const choseToRestoreAccountSelector = (state: RootState) =>
  state.account.choseToRestoreAccount

export const plaidParamsSelector = createSelector(
  [mtwAddressSelector, dataEncryptionKeySelector, currentLanguageSelector, e164NumberSelector],
  (accountMTWAddress, dekPrivate, locale, phoneNumber) => {
    return {
      accountMTWAddress,
      dekPrivate,
      locale,
      phoneNumber,
    }
  }
)
