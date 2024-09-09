import { useSelector } from 'react-redux'
import { jumpstartIntroHasBeenSeenSelector } from 'src/jumpstart/selectors'
import { Screens } from 'src/navigator/Screens'
import { jumpstartSendTokensSelector } from 'src/tokens/selectors'

export function useRightJumpstartScreen() {
  const introSeen = useSelector(jumpstartIntroHasBeenSeenSelector)
  const tokens = useSelector(jumpstartSendTokensSelector)
  const shouldSkipIntro = introSeen && tokens.length
  return shouldSkipIntro ? Screens.JumpstartEnterAmount : Screens.JumpstartIntroScreen
}
