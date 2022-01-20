import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { choseToRestoreAccountSelector } from 'src/account/selectors'
import { registrationStepsSelector } from 'src/app/selectors'

export default function useRegistrationStep() {
  const { t } = useTranslation()
  const { step, totalSteps } = useSelector(registrationStepsSelector)
  const choseToRestoreAccount = useSelector(choseToRestoreAccountSelector)

  return t(choseToRestoreAccount ? 'restoreAccountSteps' : 'createAccountSteps', {
    step,
    totalSteps,
  })
}
