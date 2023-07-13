import { act, fireEvent, render, within } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import Toast from 'react-native-simple-toast'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DappShortcutsRewards from 'src/dapps/DappShortcutsRewards'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockPositions, mockShortcuts } from 'test/values'

const mockFetch = fetch as FetchMock

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => true),
}))

jest.mock('react-native-simple-toast')

const mockCeloAddress = '0x471ece3750da237f93b8e339c536989b8978a438'
const mockUbeAddress = '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec'

const store = createMockStore({
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
})

const renderComponent = () => {
  return render(
    <Provider store={store}>
      <DappShortcutsRewards />
    </Provider>
  )
}

describe('DappShortcutsRewards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    store.clearActions()
  })

  it('should render claimable rewards correctly', () => {
    const { getByText, getAllByTestId } = renderComponent()

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

  it('should successfully claim a reward', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ message: 'OK', transactions: [] }), {
      status: 200,
    })
    const { getAllByTestId } = renderComponent()

    await act(() => {
      fireEvent.press(getAllByTestId('DappShortcutsRewards/ClaimButton')[0])
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(`${networkConfig.hooksApiUrl}/triggerShortcut`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: 'celo',
        address: '0x0000000000000000000000000000000000007e57',
        appId: 'ubeswap',
        shortcutId: 'claim-reward',
        positionAddress: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
      }),
    })
    expect(Toast.showWithGravity).toHaveBeenCalledWith(
      'dappShortcuts.claimRewardsScreen.claimSuccess',
      undefined, // these values do not matter so much, and are missing due to mocking the toast lib
      undefined
    )
  })

  it('should show an error if claim a reward fails', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ message: 'something went wrong' }), {
      status: 500,
    })
    const { getAllByTestId } = renderComponent()

    await act(() => {
      fireEvent.press(getAllByTestId('DappShortcutsRewards/ClaimButton')[0])
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(`${networkConfig.hooksApiUrl}/triggerShortcut`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: 'celo',
        address: '0x0000000000000000000000000000000000007e57',
        appId: 'ubeswap',
        shortcutId: 'claim-reward',
        positionAddress: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
      }),
    })
    expect(store.getActions()).toEqual([showError(ErrorMessages.SHORTCUT_CLAIM_REWARD_FAILED)])
  })
})
