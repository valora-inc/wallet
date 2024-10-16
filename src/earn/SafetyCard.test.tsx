import { render } from '@testing-library/react-native'
import React from 'react'
import { SafetyCard } from 'src/earn/SafetyCard'
import Colors from 'src/styles/colors'

describe('SafetyCard', () => {
  it('renders correctly', () => {
    const { getByTestId, getAllByTestId } = render(
      <SafetyCard safety={{ level: 'low', risks: [] }} />
    )

    expect(getByTestId('SafetyCard')).toBeDefined()
    expect(getByTestId('SafetyCardInfoIcon')).toBeDefined()
    expect(getAllByTestId('SafetyCard/Bar')).toHaveLength(3)
    expect(getByTestId('SafetyCard/ViewDetails')).toBeDefined()
  })

  it.each([
    { level: 'low', colors: [Colors.primary, Colors.gray2, Colors.gray2] },
    { level: 'medium', colors: [Colors.primary, Colors.primary, Colors.gray2] },
    { level: 'high', colors: [Colors.primary, Colors.primary, Colors.primary] },
  ] as const)('should render correct triple bars for safety level $level', ({ level, colors }) => {
    const { getAllByTestId } = render(<SafetyCard safety={{ level, risks: [] }} />)

    const bars = getAllByTestId('SafetyCard/Bar')
    expect(bars.length).toBe(3)
    expect(bars[0]).toHaveStyle({ backgroundColor: colors[0] })
    expect(bars[1]).toHaveStyle({ backgroundColor: colors[1] })
    expect(bars[2]).toHaveStyle({ backgroundColor: colors[2] })
  })
})
