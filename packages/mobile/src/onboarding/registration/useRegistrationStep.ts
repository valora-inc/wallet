import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { choseToRestoreAccountSelector } from 'src/account/selectors'
import { biometryEnabledSelector } from 'src/app/selectors'

export enum REGISTRATION_STEP {
  NAME_AND_PICTURE,
  PIN,
  PHONE_VERIFICATION,
  ENABLE_BIOMETRY,
  IMPORT_WALLET,
}

let createAccountSteps = [
  REGISTRATION_STEP.NAME_AND_PICTURE,
  REGISTRATION_STEP.PIN,
  REGISTRATION_STEP.PHONE_VERIFICATION,
]
let restoreAccountSteps = [
  REGISTRATION_STEP.NAME_AND_PICTURE,
  REGISTRATION_STEP.PIN,
  REGISTRATION_STEP.IMPORT_WALLET,
  REGISTRATION_STEP.PHONE_VERIFICATION,
]

export default function useRegistrationStep(step: REGISTRATION_STEP) {
  const { t } = useTranslation()
  const choseToRestoreAccount = useSelector(choseToRestoreAccountSelector)
  const biometricsEnabled = useSelector(biometryEnabledSelector)

  if (biometricsEnabled) {
    createAccountSteps = [
      REGISTRATION_STEP.NAME_AND_PICTURE,
      REGISTRATION_STEP.PIN,
      REGISTRATION_STEP.ENABLE_BIOMETRY,
      REGISTRATION_STEP.PHONE_VERIFICATION,
    ]
    restoreAccountSteps = [
      REGISTRATION_STEP.NAME_AND_PICTURE,
      REGISTRATION_STEP.PIN,
      REGISTRATION_STEP.ENABLE_BIOMETRY,
      REGISTRATION_STEP.IMPORT_WALLET,
      REGISTRATION_STEP.PHONE_VERIFICATION,
    ]
  }

  if (choseToRestoreAccount) {
    return t('restoreAccountSteps', {
      step: restoreAccountSteps.indexOf(step) + 1,
      totalSteps: restoreAccountSteps.length,
    })
  }

  return t('createAccountSteps', {
    step: createAccountSteps.indexOf(step) + 1,
    totalSteps: createAccountSteps.length,
  })
}
