import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { choseToRestoreAccountSelector } from 'src/account/selectors'
import { totalRegistrationStepsSelector } from 'src/app/selectors'

export default function useRegistrationStep(step: number) {
  const { t } = useTranslation()
  const choseToRestoreAccount = useSelector(choseToRestoreAccountSelector)
  const totalSteps = useSelector(totalRegistrationStepsSelector)

  return t(choseToRestoreAccount ? 'restoreAccountSteps' : 'createAccountSteps', {
    step,
    totalSteps,
  })
}
