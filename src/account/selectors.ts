import { Countries } from '@celo/utils/lib/countries'
import * as RNLocalize from 'react-native-localize'
import { createSelector } from 'reselect'
import i18n from 'src/i18n'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { RootState } from 'src/redux/reducers'
import { getCountryFeatures } from 'src/utils/countryFeatures'
import { currentAccountSelector, walletAddressSelector } from 'src/web3/selectors'

const inferCountryCode = () => {
  const localizedCountry = new Countries(i18n.language).getCountryByCodeAlpha2(
    RNLocalize.getCountry()
  )
  if (localizedCountry && !getCountryFeatures(localizedCountry.alpha2).SANCTIONED_COUNTRY) {
    return localizedCountry.countryCallingCode
  }
  return null
}

export const currentInterestsSelector = (state: RootState) => state.account.currentInterests
export const devModeSelector = (state: RootState) => state.account.devModeActive
export const nameSelector = (state: RootState) => state.account.name
export const e164NumberSelector = (state: RootState) => state.account.e164PhoneNumber
export const pictureSelector = (state: RootState) => state.account.pictureUri
export const defaultCountryCodeSelector = createSelector(
  (state: RootState) => state.account.defaultCountryCode,
  (defaultCountryCode) => {
    return defaultCountryCode || inferCountryCode()
  }
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
export const finclusiveKycStatusSelector = (state: RootState) => state.account.finclusiveKycStatus

export const finclusiveRegionSupportedSelector = (state: RootState) =>
  state.account.finclusiveRegionSupported

export const backupCompletedSelector = (state: RootState) => state.account.backupCompleted

export const choseToRestoreAccountSelector = (state: RootState) =>
  state.account.choseToRestoreAccount

export const plaidParamsSelector = createSelector(
  [walletAddressSelector, currentLanguageSelector, e164NumberSelector],
  (walletAddress, locale, phoneNumber) => {
    return {
      walletAddress,
      locale,
      phoneNumber,
    }
  }
)
