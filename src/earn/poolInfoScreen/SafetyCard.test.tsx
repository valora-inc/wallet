import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { SafetyCard } from 'src/earn/poolInfoScreen/SafetyCard'
import Colors from 'src/styles/colors'
import { NetworkId } from 'src/transactions/types'

describe('SafetyCard', () => {
  const mockProps = {
    commonAnalyticsProps: {
      poolId: 'poolId',
      providerId: 'providerId',
      networkId: NetworkId['arbitrum-sepolia'],
      depositTokenId: 'depositTokenId',
    },
    safety: {
      level: 'low' as const,
      risks: [
        { title: 'Risk 1', category: 'Category 1', isPositive: true },
        { title: 'Risk 2', category: 'Category 2', isPositive: false },
      ],
    },
    onInfoIconPress: jest.fn(),
  }
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByTestId, getAllByTestId } = render(<SafetyCard {...mockProps} />)

    expect(getByTestId('SafetyCard')).toBeTruthy()
    expect(getByTestId('SafetyCardInfoIcon')).toBeTruthy()
    expect(getAllByTestId('SafetyCard/Bar')).toHaveLength(3)
    expect(getByTestId('SafetyCard/ViewDetails')).toBeTruthy()
    expect(getByTestId('SafetyCard/ViewDetails')).toHaveTextContent(
      'earnFlow.poolInfoScreen.viewMoreDetails'
    )
  })

  it.each([
    { level: 'low', colors: [Colors.accent, Colors.gray2, Colors.gray2] },
    { level: 'medium', colors: [Colors.accent, Colors.accent, Colors.gray2] },
    { level: 'high', colors: [Colors.accent, Colors.accent, Colors.accent] },
  ] as const)('should render correct triple bars for safety level $level', ({ level, colors }) => {
    const { getAllByTestId } = render(<SafetyCard {...mockProps} safety={{ level, risks: [] }} />)

    const bars = getAllByTestId('SafetyCard/Bar')
    expect(bars).toHaveLength(3)
    expect(bars[0]).toHaveStyle({ backgroundColor: colors[0] })
    expect(bars[1]).toHaveStyle({ backgroundColor: colors[1] })
    expect(bars[2]).toHaveStyle({ backgroundColor: colors[2] })
  })

  it('expands and collapses card and displays risks when View More/Less Details is pressed', () => {
    const { getByTestId, getAllByTestId, queryByTestId } = render(<SafetyCard {...mockProps} />)

    expect(queryByTestId('SafetyCard/Risk')).toBeFalsy()
    expect(getByTestId('SafetyCard/ViewDetails')).toHaveTextContent(
      'earnFlow.poolInfoScreen.viewMoreDetails'
    )

    // expand
    fireEvent.press(getByTestId('SafetyCard/ViewDetails'))
    expect(getAllByTestId('SafetyCard/Risk')).toHaveLength(2)
    expect(getByTestId('SafetyCard/ViewDetails')).toHaveTextContent(
      'earnFlow.poolInfoScreen.viewLessDetails'
    )
    expect(getAllByTestId('SafetyCard/Risk')[0].children[0]).toContainElement(
      getByTestId('SafetyCard/RiskPositive')
    )
    expect(getAllByTestId('SafetyCard/Risk')[0]).toHaveTextContent('Risk 1')
    expect(getAllByTestId('SafetyCard/Risk')[0]).toHaveTextContent('Category 1')
    expect(getAllByTestId('SafetyCard/Risk')[1].children[0]).toContainElement(
      getByTestId('SafetyCard/RiskNegative')
    )
    expect(getAllByTestId('SafetyCard/Risk')[1]).toHaveTextContent('Risk 2')
    expect(getAllByTestId('SafetyCard/Risk')[1]).toHaveTextContent('Category 2')
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_safety_details, {
      action: 'expand',
      ...mockProps.commonAnalyticsProps,
    })
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)

    // collapse
    fireEvent.press(getByTestId('SafetyCard/ViewDetails'))
    expect(queryByTestId('SafetyCard/Risk')).toBeFalsy()
    expect(getByTestId('SafetyCard/ViewDetails')).toHaveTextContent(
      'earnFlow.poolInfoScreen.viewMoreDetails'
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_safety_details, {
      action: 'collapse',
      ...mockProps.commonAnalyticsProps,
    })
    expect(AppAnalytics.track).toHaveBeenCalledTimes(2)
  })

  it('triggers callback when info icon is pressed', () => {
    const { getByTestId } = render(<SafetyCard {...mockProps} />)
    fireEvent.press(getByTestId('SafetyCardInfoIcon'))
    expect(mockProps.onInfoIconPress).toHaveBeenCalledTimes(1)
  })
})
