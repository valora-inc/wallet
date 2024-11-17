import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnEntrypoint from 'src/earn/EarnEntrypoint'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'

jest.mock('src/statsig')

describe('EarnEntrypoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate !== StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)
  })

  it('renders nothing for UK compliant variant', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)

    const { toJSON } = render(<EarnEntrypoint />)

    expect(toJSON()).toBeNull()
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
