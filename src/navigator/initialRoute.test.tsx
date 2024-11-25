import { PincodeType } from 'src/account/reducer'
import { getInitialRoute } from 'src/navigator/initialRoute'
import { Screens } from 'src/navigator/Screens'

describe('initialRoute', () => {
  const defaultArgs: Parameters<typeof getInitialRoute>[0] = {
    language: 'en',
    pincodeType: PincodeType.CustomPin,
    acceptedTerms: true,
    onboardingCompleted: false,
    lastOnboardingStepScreen: Screens.SignInWithEmail,
  }
  it('returns language if no language set', () => {
    expect(getInitialRoute({ ...defaultArgs, language: null })).toEqual(Screens.Language)
  })
  it('returns welcome if terms not accepted', () => {
    expect(getInitialRoute({ ...defaultArgs, acceptedTerms: false })).toEqual(Screens.Welcome)
  })
  it('returns welcome if no pincode', () => {
    expect(getInitialRoute({ ...defaultArgs, pincodeType: PincodeType.Unset })).toEqual(
      Screens.Welcome
    )
  })
  it('returns home if onboarding done', () => {
    expect(getInitialRoute({ ...defaultArgs, onboardingCompleted: true })).toEqual(
      Screens.TabNavigator
    )
  })
  it('otherwise returns last onboarding screen', () => {
    expect(getInitialRoute({ ...defaultArgs })).toEqual(Screens.SignInWithEmail)
  })
})
