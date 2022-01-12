import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  choseToRestoreAccountSelector,
  totalRegistrationStepsSelector,
} from 'src/account/selectors'

export default function useRegistrationStep(step: number) {
  const { t } = useTranslation()
  const choseToRestoreAccount = useSelector(choseToRestoreAccountSelector)
  const totalSteps = useSelector(totalRegistrationStepsSelector)

  return t(choseToRestoreAccount ? 'restoreAccountSteps' : 'createAccountSteps', {
    step,
    totalSteps,
  })
}
