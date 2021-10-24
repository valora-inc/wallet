import { StackScreenProps } from '@react-navigation/stack'
import { noHeader } from 'src/navigator/Headers'
import { modalScreenOptions } from 'src/navigator/Navigator'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type OwnProps = StackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>
type Props = OwnProps

export const sendConfirmationScreenNavOptions = (navOptions: Props) =>
  navOptions.route.name === Screens.SendConfirmationModal
    ? {
        ...noHeader,
        ...modalScreenOptions(navOptions),
      }
    : noHeader

function SendConfirmation(props: Props) {
  // TODO: Complete this function
  return null
}

export default SendConfirmation
