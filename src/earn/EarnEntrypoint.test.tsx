import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { EarnEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import EarnEntrypoint from 'src/earn/EarnEntrypoint'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

describe('EarnEntrypoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText } = render(<EarnEntrypoint />)

    expect(getByText('earnFlow.entrypoint.title')).toBeTruthy()
    expect(getByText('earnFlow.entrypoint.subtitle')).toBeTruthy()
    expect(getByText('earnFlow.entrypoint.description')).toBeTruthy()
  })

  it('navigates to EarnInfoScreen when pressed', async () => {
    const { getByTestId } = render(<EarnEntrypoint />)

    fireEvent.press(getByTestId('EarnEntrypoint'))

    expect(navigate).toHaveBeenCalledWith(Screens.EarnInfoScreen)
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_entrypoint_press)
  })
})
