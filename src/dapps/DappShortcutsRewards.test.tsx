import { render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import DappShortcutsRewards from 'src/dapps/DappShortcutsRewards'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockPositions, mockShortcuts } from 'test/values'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => true),
}))

const mockCeloAddress = '0x471ece3750da237f93b8e339c536989b8978a438'
const mockUbeAddress = '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec'

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
          tokens: {
            tokenBalances: {
              [mockCeloAddress]: {
                address: mockCeloAddress,
                symbol: 'CELO',
                usdPrice: '0.6959536890241361', // matches data in mockPositions
                balance: '10',
                priceFetchedAt: Date.now(),
                isCoreToken: true,
              },
              [mockUbeAddress]: {
                address: mockUbeAddress,
                symbol: 'UBE',
                usdPrice: '0.00904673476946796903', // matches data in mockPositions
                balance: '10',
                priceFetchedAt: Date.now(),
              },
              [mockCusdAddress]: {
                address: mockCusdAddress,
                symbol: 'cUSD',
                usdPrice: '1',
                balance: '10',
                priceFetchedAt: Date.now(),
                isCoreToken: true,
              },
            },
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
    expect(within(rewardCard).getByTestId('DappShortcutsRewards/RewardAmount')).toHaveTextContent(
      '0.098 UBE, 0.95 CELO'
    )
    expect(
      within(rewardCard).getByTestId('DappShortcutsRewards/RewardAmountFiat')
    ).toHaveTextContent('₱0.88') // USD value $0.66, mocked exchange rate 1.33
    expect(within(rewardCard).getByTestId('DappShortcutsRewards/ClaimButton')).toBeTruthy()
  })
})
