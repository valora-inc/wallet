import { render } from '@testing-library/react-native'
import * as React from 'react'
import PercentageIndicator from 'src/components/PercentageIndicator'
import { getElementText } from 'test/utils'

describe('PercentageIndicator', () => {
  it('renders correctly when compared value is lower than current', async () => {
    const tree = render(
      <PercentageIndicator comparedValue={0.5} currentValue={2} testID={`testIndicator`} />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('300.00%')
    expect(tree.queryByTestId('testIndicator:UpIndicator')).toBeTruthy()
    expect(tree.queryByTestId('testIndicator:DownIndicator')).toBeFalsy()
  })

  it('renders correctly when compared value is greater than current', async () => {
    const tree = render(
      <PercentageIndicator comparedValue={4} currentValue={2} testID={`testIndicator`} />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('50.00%')
    expect(tree.queryByTestId('testIndicator:DownIndicator')).toBeTruthy()
    expect(tree.queryByTestId('testIndicator:UpIndicator')).toBeFalsy()
  })

  it('renders correctly when compared value is equal to current', async () => {
    const tree = render(
      <PercentageIndicator comparedValue={2} currentValue={2} testID={`testIndicator`} />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('0.00%')
    expect(tree.queryByTestId('testIndicator:DownIndicator')).toBeFalsy()
    expect(tree.queryByTestId('testIndicator:UpIndicator')).toBeFalsy()
  })
})
