import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
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
    expect(tree.getByTestId('testIndicator:UpIndicator').type).toEqual('svg')
  })

  it('renders correctly when compared value is greater than current', async () => {
    const tree = render(
      <PercentageIndicator comparedValue={4} currentValue={2} testID={`testIndicator`} />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('50.00%')
    expect(tree.queryByTestId('testIndicator:DownIndicator')).toBeTruthy()
    expect(tree.queryByTestId('testIndicator:UpIndicator')).toBeFalsy()
    expect(tree.getByTestId('testIndicator:DownIndicator').type).toEqual('svg')
  })

  it('renders correctly when compared value is equal to current', async () => {
    const tree = render(
      <PercentageIndicator comparedValue={2} currentValue={2} testID={`testIndicator`} />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('0.00%')
    expect(tree.queryByTestId('testIndicator:DownIndicator')).toBeFalsy()
    expect(tree.queryByTestId('testIndicator:UpIndicator')).toBeFalsy()
  })

  it('renders correctly with custom icons when compared value is lower than current', async () => {
    const upIcon = jest.fn(({ testID }) => <Text testID={testID}>Up Icon</Text>)
    const downIcon = jest.fn(({ testID }) => <Text testID={testID}>Down Icon</Text>)
    const noChangeIcon = jest.fn(({ testID }) => <Text testID={testID}>NoChange Icon</Text>)
    const tree = render(
      <PercentageIndicator
        comparedValue={0.5}
        currentValue={2}
        testID={`testIndicator`}
        UpIcon={upIcon}
        DownIcon={downIcon}
        NoChangeIcon={noChangeIcon}
      />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('Up Icon300.00%')
    expect(tree.queryByTestId('testIndicator:UpIndicator')).toBeTruthy()
    expect(tree.queryByTestId('testIndicator:DownIndicator')).toBeFalsy()
    expect(tree.queryByTestId('testIndicator:NoChangeIndicator')).toBeFalsy()
    expect(tree.getByTestId('testIndicator:UpIndicator').type).toEqual('Text')
  })

  it('renders correctly with custom icons when compared value is greater than current', async () => {
    const upIcon = jest.fn(({ testID }) => <Text testID={testID}>Up Icon</Text>)
    const downIcon = jest.fn(({ testID }) => <Text testID={testID}>Down Icon</Text>)
    const noChangeIcon = jest.fn(({ testID }) => <Text testID={testID}>NoChange Icon</Text>)
    const tree = render(
      <PercentageIndicator
        comparedValue={4}
        currentValue={2}
        testID={`testIndicator`}
        UpIcon={upIcon}
        DownIcon={downIcon}
        NoChangeIcon={noChangeIcon}
      />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('Down Icon50.00%')
    expect(tree.queryByTestId('testIndicator:DownIndicator')).toBeTruthy()
    expect(tree.queryByTestId('testIndicator:UpIndicator')).toBeFalsy()
    expect(tree.queryByTestId('testIndicator:NoChangeIndicator')).toBeFalsy()
    expect(tree.getByTestId('testIndicator:DownIndicator').type).toEqual('Text')
  })

  it('renders correctly with custom icons when compared value is equal to current', async () => {
    const upIcon = jest.fn(({ testID }) => <Text testID={testID}>Up Icon</Text>)
    const downIcon = jest.fn(({ testID }) => <Text testID={testID}>Down Icon</Text>)
    const noChangeIcon = jest.fn(({ testID }) => <Text testID={testID}>NoChange Icon</Text>)
    const tree = render(
      <PercentageIndicator
        comparedValue={2}
        currentValue={2}
        testID={`testIndicator`}
        UpIcon={upIcon}
        DownIcon={downIcon}
        NoChangeIcon={noChangeIcon}
      />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('NoChange Icon0.00%')
    expect(tree.queryByTestId('testIndicator:DownIndicator')).toBeFalsy()
    expect(tree.queryByTestId('testIndicator:UpIndicator')).toBeFalsy()
    expect(tree.queryByTestId('testIndicator:NoChangeIndicator')).toBeTruthy()
    expect(tree.getByTestId('testIndicator:NoChangeIndicator').type).toEqual('Text')
  })

  it('renders correctly with suffix text', async () => {
    const tree = render(
      <PercentageIndicator
        comparedValue={0.5}
        currentValue={2}
        testID={`testIndicator`}
        suffixText="Today"
      />
    )

    expect(getElementText(tree.getByTestId('testIndicator'))).toBe('300.00%Today')
  })
})
