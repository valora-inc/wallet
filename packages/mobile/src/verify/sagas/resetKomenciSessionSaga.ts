import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

// Should this not be part of the saga? When we find out a user ran out of Komenci quota we need
// them to redo the reCaptcha. To do that they need to go back to the VerificationEducationScreen.
// When this happens they are usually on the VerificationInputScreen, so this brings them back so
// they have to press on 'start' again and they get the reCaptcha prompt.
export default function resetKomenciSessionSaga() {
  navigate(Screens.VerificationEducationScreen)
}
