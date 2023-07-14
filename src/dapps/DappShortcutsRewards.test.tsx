import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import DappShortcutsRewards from 'src/dapps/DappShortcutsRewards'
import { Position } from 'src/positions/types'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockPositions, mockShortcuts } from 'test/values'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => true),
}))

const mockCeloAddress = '0x471ece3750da237f93b8e339c536989b8978a438'
const mockUbeAddress = '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec'

const getPositionWithClaimableBalance = (balance?: string): Position => ({
  type: 'contract-position',
  network: 'celo',
  address: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
  appId: 'ubeswap',
  appName: 'Ubeswap',
  displayProps: {
    title: 'CELO / cUSD',
    description: 'Farm',
    imageUrl: '',
  },
  tokens: [
    {
      type: 'app-token',
      network: 'celo',
      address: '0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e',
      appId: 'ubeswap',
      symbol: 'ULP',
      decimals: 18,
      appName: 'Ubeswap',
      displayProps: {
        title: 'CELO / cUSD',
        description: 'Pool',
        imageUrl: '',
      },
      tokens: [
        {
          type: 'base-token',
          network: 'celo',
          address: '0x471ece3750da237f93b8e339c536989b8978a438',
          symbol: 'CELO',
          decimals: 18,
          priceUsd: '0.6959536890241361',
          balance: balance ?? '0.950545800159603456',
          category: 'claimable',
        },
        {
          type: 'base-token',
          network: 'celo',
          address: '0x765de816845861e75a25fca122bb6898b8b1282a',
          symbol: 'cUSD',
          decimals: 18,
          priceUsd: '1',
          balance: '0.659223169268731392',
        },
      ],
      pricePerShare: ['2.827719585853931', '1.961082008754231'],
      priceUsd: '3.9290438860550765',
      balance: '0.336152780111169400',
      supply: '42744.727037884449180591',
      availableShortcutIds: [],
    },
    {
      priceUsd: '0.00904673476946796903',
      type: 'base-token',
      category: 'claimable',
      decimals: 18,
      network: 'celo',
      balance: balance ?? '0.098322815093446616',
      symbol: 'UBE',
      address: '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec',
    },
  ],
  balanceUsd: '1.3207590254762067',
  availableShortcutIds: ['claim-reward'],
})

const defaultState = {
  positions: {
    positions: [...mockPositions.slice(0, 2), getPositionWithClaimableBalance()],
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
}
const mockStore = createMockStore(defaultState)

describe('DappShortcutsRewards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStore.clearActions()
  })

  it('should render claimable rewards correctly', () => {
    const { getByText, getAllByTestId } = render(
      <Provider store={mockStore}>
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

  it('should dispatch the correct action on claim', () => {
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <DappShortcutsRewards />
      </Provider>
    )

    fireEvent.press(getAllByTestId('DappShortcutsRewards/ClaimButton')[0])

    expect(mockStore.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "payload": Object {
            "address": "0x0000000000000000000000000000000000007e57",
            "appId": "ubeswap",
            "id": "claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-1.048868615253050072",
            "network": "celo",
            "positionAddress": "0xda7f463c27ec862cfbf2369f3f74c364d050d93f",
            "shortcutId": "claim-reward",
          },
          "type": "positions/triggerShortcut",
        },
      ]
    `)
  })

  it('should show a claimed reward correctly', () => {
    const { getByTestId, getByText, queryByText, rerender } = render(
      <Provider store={mockStore}>
        <DappShortcutsRewards />
      </Provider>
    )

    expect(getByTestId('DappShortcutsRewards/ClaimButton')).toBeEnabled()
    expect(queryByText('dappShortcuts.claimRewardsScreen.claimedLabel')).toBeFalsy()
    expect(getByText('dappShortcuts.claimRewardsScreen.claimButton')).toBeTruthy()

    const updatedStore = createMockStore({
      ...defaultState,
      positions: {
        ...defaultState.positions,
        positions: [...mockPositions.slice(0, 2), getPositionWithClaimableBalance('0')],
      },
    })
    rerender(
      <Provider store={updatedStore}>
        <DappShortcutsRewards />
      </Provider>
    )

    expect(getByTestId('DappShortcutsRewards/ClaimButton')).toBeDisabled()
    expect(queryByText('dappShortcuts.claimRewardsScreen.claimButton')).toBeFalsy()
    expect(getByText('dappShortcuts.claimRewardsScreen.claimedLabel')).toBeTruthy()
  })

  it('should show a claimed, updated reward correctly', () => {
    const { getByTestId, getByText, queryByText, rerender } = render(
      <Provider store={mockStore}>
        <DappShortcutsRewards />
      </Provider>
    )

    expect(getByTestId('DappShortcutsRewards/ClaimButton')).toBeEnabled()
    expect(queryByText('dappShortcuts.claimRewardsScreen.claimedLabel')).toBeFalsy()
    expect(getByText('dappShortcuts.claimRewardsScreen.claimButton')).toBeTruthy()

    const updatedStore = createMockStore({
      ...defaultState,
      positions: {
        ...defaultState.positions,
        positions: [...mockPositions.slice(0, 2), getPositionWithClaimableBalance('0.01')],
      },
    })
    rerender(
      <Provider store={updatedStore}>
        <DappShortcutsRewards />
      </Provider>
    )

    expect(getByTestId('DappShortcutsRewards/ClaimButton')).toBeEnabled()
    expect(queryByText('dappShortcuts.claimRewardsScreen.claimedLabel')).toBeFalsy()
    expect(getByText('dappShortcuts.claimRewardsScreen.claimButton')).toBeTruthy()
  })
})
