import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { PointsEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import SwapArrows from 'src/icons/SwapArrows'
import ActivityCard, { Props } from './ActivityCard'

jest.mock('src/analytics/AppAnalytics')

const mockProps: Props = {
  activityId: 'swap',
  pointsAmount: 20,
  previousPointsAmount: 10,
  completed: false,
  title: 'Swap',
  icon: <SwapArrows testID="SwapArrowsIcon" />,
  onPress: jest.fn(),
}

describe('ActivityCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<ActivityCard {...mockProps} />)

    expect(getByText('Swap')).toBeTruthy()
    expect(getByText('20')).toBeTruthy()
    expect(getByText('10')).toBeTruthy()
    expect(getByTestId('SwapArrowsIcon')).toBeTruthy()
  })

  it('renders correcly when completed', () => {
    const completedProps = { ...mockProps, completed: true }
    const { getByTestId } = render(<ActivityCard {...completedProps} />)

    const card = getByTestId('ActivityCard/swap')
    expect(card).toBeDisabled()
    expect(card.props.style).toContainEqual({ opacity: 0.5 })
    expect(getByTestId('CheckCircleIcon')).toBeTruthy()
  })

  it('handles press correctly', () => {
    const { getByText } = render(<ActivityCard {...mockProps} />)

    fireEvent.press(getByText('Swap'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_press, {
      activityId: 'swap',
    })
    expect(mockProps.onPress).toHaveBeenCalled()
  })

  it('tracks analytics event even when no press handler provided', () => {
    const noPressProps = { ...mockProps, onPress: undefined }
    const { getByText } = render(<ActivityCard {...noPressProps} />)

    fireEvent.press(getByText('Swap'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(PointsEvents.points_screen_card_press, {
      activityId: 'swap',
    })
  })
})
