import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import DappShortcutsRewards from 'src/dapps/DappShortcutsRewards'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Position } from 'src/positions/types'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockCusdTokenId, mockPositions, mockShortcuts } from 'test/values'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => true),
}))
jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const mockCeloAddress = '0x471ece3750da237f93b8e339c536989b8978a438'
const mockUbeAddress = '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec'
const mockCeloTokenId = `celo-alfajores:${mockCeloAddress}`
const mockUbeTokenId = `celo-alfajores:${mockUbeAddress}`

const getPositionWithClaimableBalance = (balance?: string): Position => ({
  type: 'contract-position',
  networkId: NetworkId['celo-mainnet'],
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
      networkId: NetworkId['celo-mainnet'],
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
          networkId: NetworkId['celo-mainnet'],
          address: '0x471ece3750da237f93b8e339c536989b8978a438',
          symbol: 'CELO',
          decimals: 18,
          priceUsd: '0.6959536890241361',
          balance: balance ?? '0.950545800159603456',
          category: 'claimable',
        },
        {
          type: 'base-token',
          networkId: NetworkId['celo-mainnet'],
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
      networkId: NetworkId['celo-mainnet'],
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
      [mockCeloTokenId]: {
        address: mockCeloAddress,
        tokenId: mockCeloTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'CELO',
        priceUsd: '0.6959536890241361', // matches data in mockPositions
        balance: '10',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
      },
      [mockUbeTokenId]: {
        address: mockUbeAddress,
        tokenId: mockUbeTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'UBE',
        priceUsd: '0.00904673476946796903', // matches data in mockPositions
        balance: '10',
        priceFetchedAt: Date.now(),
      },
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        priceUsd: '1',
        balance: '10',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
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

  it('should dispatch the correct action on claim', async () => {
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <DappShortcutsRewards />
      </Provider>
    )

    fireEvent.press(getAllByTestId('DappShortcutsRewards/ClaimButton')[0])

    expect(mockStore.getActions()).toMatchInlineSnapshot(`
      [
        {
          "payload": {
            "appImage": "",
            "appName": "Ubeswap",
            "data": {
              "address": "0x0000000000000000000000000000000000007e57",
              "appId": "ubeswap",
              "networkId": "celo-mainnet",
              "positionAddress": "0xda7f463c27ec862cfbf2369f3f74c364d050d93f",
              "shortcutId": "claim-reward",
            },
            "id": "claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-1.048868615253050072",
          },
          "type": "positions/triggerShortcut",
        },
      ]
    `)
    expect(navigate).toHaveBeenCalledWith(Screens.DappShortcutTransactionRequest, {
      rewardId: 'claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-1.048868615253050072',
    })
  })

  it('should show a reward being claimed', () => {
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          ...defaultState,
          positions: {
            ...defaultState.positions,
            triggeredShortcutsStatus: {
              'claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-1.048868615253050072': {
                status: 'accepting',
                transactions: [],
              },
            },
          },
        })}
      >
        <DappShortcutsRewards />
      </Provider>
    )

    expect(getByTestId('DappShortcutsRewards/ClaimButton')).toBeDisabled()
    expect(getByTestId('Button/Loading')).toBeTruthy()
  })

  it('should show a claimed reward when it is no longer claimable in redux', () => {
    const { getByTestId, getByText, queryByText, rerender } = render(
      <Provider store={mockStore}>
        <DappShortcutsRewards />
      </Provider>
    )

    expect(getByTestId('DappShortcutsRewards/ClaimButton')).toBeEnabled()
    expect(queryByText('dappShortcuts.claimRewardsScreen.claimedLabel')).toBeFalsy()
    expect(getByText('dappShortcuts.claimRewardsScreen.claimButton')).toBeTruthy()

    // simulate data refresh after a successful claim
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

    // simulate data refresh after a successful claim, for a continuously claimable reward
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
