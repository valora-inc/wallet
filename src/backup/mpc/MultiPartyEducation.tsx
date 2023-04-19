import { StackScreenProps, TransitionPresets } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Education, { EmbeddedNavBar } from 'src/account/Education'
import { useMultiPartyEducation } from 'src/backup/mpc/hooks'
import { BtnTypes } from 'src/components/Button'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

const TAG = 'education/keyshare'

type OwnProps = {}
type Props = OwnProps & StackScreenProps<StackParamList, Screens.MultiPartyEducationScreen>

const MultiPartyEducation = ({ route }: Props) => {
  const { t } = useTranslation()
  const steps = useMultiPartyEducation()

  const onComplete = async () => {
    navigate(Screens.ManageKeyshareScreen)
  }

  return (
    <Education
      embeddedNavBar={EmbeddedNavBar.Close}
      stepInfo={steps}
      onFinish={onComplete}
      finalButtonText={t('continue')}
      finalButtonType={BtnTypes.PRIMARY}
      buttonText={t('next')}
    />
  )
}

MultiPartyEducation.navigationOptions = {
  ...noHeader,
  ...TransitionPresets.ModalTransition,
}

export default MultiPartyEducation
