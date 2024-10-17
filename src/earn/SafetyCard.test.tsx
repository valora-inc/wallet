import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { SafetyCard } from 'src/earn/SafetyCard'
import Colors from 'src/styles/colors'
import { NetworkId } from 'src/transactions/types'

const mockAnalyticsProps = {
  poolId: 'poolId',
  providerId: 'providerId',
  networkId: NetworkId['arbitrum-sepolia'],
  depositTokenId: 'depositTokenId',
}

describe('SafetyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByTestId, getAllByTestId } = render(
      <SafetyCard safety={{ level: 'low', risks: [] }} commonAnalyticsProps={mockAnalyticsProps} />
    )

    expect(getByTestId('SafetyCard')).toBeTruthy()
    expect(getByTestId('SafetyCardInfoIcon')).toBeTruthy()
    expect(getAllByTestId('SafetyCard/Bar')).toHaveLength(3)
    expect(getByTestId('SafetyCard/ViewDetails')).toBeTruthy()
    expect(getByTestId('SafetyCard/ViewDetails')).toHaveTextContent(
      'earnFlow.poolInfoScreen.viewMoreDetails'
    )
  })

  it.each([
    { level: 'low', colors: [Colors.primary, Colors.gray2, Colors.gray2] },
    { level: 'medium', colors: [Colors.primary, Colors.primary, Colors.gray2] },
    { level: 'high', colors: [Colors.primary, Colors.primary, Colors.primary] },
  ] as const)('should render correct triple bars for safety level $level', ({ level, colors }) => {
    const { getAllByTestId } = render(
      <SafetyCard safety={{ level, risks: [] }} commonAnalyticsProps={mockAnalyticsProps} />
    )

    const bars = getAllByTestId('SafetyCard/Bar')
    expect(bars).toHaveLength(3)
    expect(bars[0]).toHaveStyle({ backgroundColor: colors[0] })
    expect(bars[1]).toHaveStyle({ backgroundColor: colors[1] })
    expect(bars[2]).toHaveStyle({ backgroundColor: colors[2] })
  })

  it('expands and collapses card and displays risks when View More/Less Details is pressed', () => {
    const { getByTestId, getAllByTestId, queryByTestId } = render(
      <SafetyCard
        safety={{
          level: 'low',
          risks: [
            { title: 'Risk 1', category: 'Category 1', isPositive: true },
            { title: 'Risk 2', category: 'Category 2', isPositive: false },
          ],
        }}
        commonAnalyticsProps={mockAnalyticsProps}
      />
    )

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
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_safety_details, {
      action: 'expand',
      ...mockAnalyticsProps,
    })
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)

    // collapse
    fireEvent.press(getByTestId('SafetyCard/ViewDetails'))
    expect(queryByTestId('SafetyCard/Risk')).toBeFalsy()
    expect(getByTestId('SafetyCard/ViewDetails')).toHaveTextContent(
      'earnFlow.poolInfoScreen.viewMoreDetails'
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_safety_details, {
      action: 'collapse',
      ...mockAnalyticsProps,
    })
    expect(AppAnalytics.track).toHaveBeenCalledTimes(2)
  })
})
