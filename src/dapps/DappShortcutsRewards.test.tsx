import { render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import DappShortcutsRewards from 'src/dapps/DappShortcutsRewards'
import { createMockStore } from 'test/utils'
import { mockPositions, mockShortcuts } from 'test/values'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => true),
}))

describe('DappShortcutsRewards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render claimable rewards correctly', () => {
    const { getByText, getAllByTestId } = render(
      <Provider
        store={createMockStore({
          positions: {
            positions: mockPositions,
            shortcuts: mockShortcuts,
          },
        })}
      >
        <DappShortcutsRewards />
      </Provider>
    )

    expect(getByText('dappShortcuts.claimRewardsScreen.title')).toBeTruthy()
    expect(getByText('dappShortcuts.claimRewardsScreen.description')).toBeTruthy()
    expect(getAllByTestId('DappShortcutsRewards/Card').length).toBe(1)

    const rewardCard = getAllByTestId('DappShortcutsRewards/Card')[0]
    expect(within(rewardCard).getByText('0.09832 UBE, 0.95055 CELO')).toBeTruthy()
    expect(within(rewardCard).getByText('₱ 0.88')).toBeTruthy() // USD value $0.66, mocked exchange rate 1.33
    expect(within(rewardCard).getByTestId('DappShortcutsRewards/ClaimButton')).toBeTruthy()
  })
})
