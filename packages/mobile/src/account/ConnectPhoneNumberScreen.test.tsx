import ConnectPhoneNumberScreen from 'src/account/ConnectPhoneNumberScreen'
import { navigate } from 'src/navigator/NavigationService'
import * as React from 'react'
import { Screens } from 'src/navigator/Screens'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOEvents } from 'src/analytics/Events'

describe('ConnectPhoneNumberScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('navigates to VerificationEducationScreen when button is clicked', async () => {
    const tree = render(<ConnectPhoneNumberScreen />)
    fireEvent.press(tree.getByTestId('ConnectPhoneNumberLink'))
    expect(navigate).toBeCalledWith(Screens.VerificationEducationScreen, {
      hideOnboardingStep: true,
    })
    expect(ValoraAnalytics.track).toBeCalledWith(CICOEvents.connect_phone_start)
  })
})
