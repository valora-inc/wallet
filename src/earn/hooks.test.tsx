import { render } from '@testing-library/react-native'
import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import { useEarnPositionBalanceValues } from 'src/earn/hooks'
import { EarnPosition } from 'src/positions/types'
import { createMockStore } from 'test/utils'
import { mockEarnPositions } from 'test/values'

function TestComponent({ pools }: { pools: EarnPosition[] }) {
  const poolBalances = useEarnPositionBalanceValues({ pools })

  return (
    <View>
      <Text testID="poolBalanceInUsd">{poolBalances[0].poolBalanceInUsd.toNumber()}</Text>
      <Text testID="poolBalanceInDepositToken">
        {poolBalances[0].poolBalanceInDepositToken.toNumber()}
      </Text>
      {poolBalances[1]?.poolBalanceInUsd && (
        <Text testID="poolBalanceInUsdSecondPool">
          {poolBalances[1].poolBalanceInUsd.toNumber()}
        </Text>
      )}
      {poolBalances[1]?.poolBalanceInDepositToken && (
        <Text testID="poolBalanceInDepositTokenSecondPool">
          {poolBalances[1].poolBalanceInDepositToken.toNumber()}
        </Text>
      )}
    </View>
  )
}

describe('useEarnPositionBalanceValues', () => {
  it('should return the correct USD and depositToken crypto balances for a single pool', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <TestComponent pools={[{ ...mockEarnPositions[0], balance: '100' }]} />
      </Provider>
    )
    expect(getByTestId('poolBalanceInUsd').props.children).toEqual(120)
    expect(getByTestId('poolBalanceInDepositToken').props.children).toEqual(110)
  })
  it('should return the correct USD and depositToken crypto balances for multiple pools', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <TestComponent
          pools={[
            { ...mockEarnPositions[0], balance: '100' },
            { ...mockEarnPositions[1], balance: '2', priceUsd: '500' },
          ]}
        />
      </Provider>
    )
    expect(getByTestId('poolBalanceInUsd').props.children).toEqual(120)
    expect(getByTestId('poolBalanceInDepositToken').props.children).toEqual(110)
    expect(getByTestId('poolBalanceInUsdSecondPool').props.children).toEqual(1000)
    expect(getByTestId('poolBalanceInDepositTokenSecondPool').props.children).toEqual(2)
  })
})
