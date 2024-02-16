import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { AppTokenPosition } from 'src/positions/types'
import { PositionItem, TokenBalanceItem } from 'src/tokens/AssetItem'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockCusdTokenId, mockPositions } from 'test/values'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PositionItem', () => {
  it('tracks data about the asset when tapped', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={mockPositions[0]} />
      </Provider>
    )

    fireEvent.press(getByText('MOO / CELO'))

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AssetsEvents.tap_asset, {
      address: '0x19a75250c5a3ab22a8662e55a2b90ff9d3334b00',
      appId: 'ubeswap',
      assetType: 'position',
      balanceUsd: 2.509873993477929,
      description: 'Pool',
      network: 'celo',
      title: 'MOO / CELO',
    })
  })

  it('shows the correct info for a position', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={mockPositions[0]} />
      </Provider>
    )

    expect(getByText('MOO / CELO')).toBeTruthy()
    expect(getByText('Pool')).toBeTruthy()
    expect(getByText('₱3.34')).toBeTruthy()
    expect(getByText('11.90')).toBeTruthy()
  })

  it('shows the correct info for a position with a negative balance', () => {
    const mockPosition = mockPositions[0] as AppTokenPosition
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={{ ...mockPosition, balance: `-${mockPosition.balance}` }} />
      </Provider>
    )

    expect(getByText('MOO / CELO')).toBeTruthy()
    expect(getByText('Pool')).toBeTruthy()
    expect(getByText('-₱3.34')).toBeTruthy()
    expect(getByText('-11.90')).toBeTruthy()
  })

  it('shows the correct info for a position with a 0 price', () => {
    const mockPosition = mockPositions[0] as AppTokenPosition
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={{ ...mockPosition, priceUsd: '0' }} />
      </Provider>
    )

    expect(getByText('MOO / CELO')).toBeTruthy()
    expect(getByText('Pool')).toBeTruthy()
    expect(getByText('-')).toBeTruthy()
    expect(getByText('11.90')).toBeTruthy()
  })
})

describe('TokenBalanceItem', () => {
  const mockTokenInfo = {
    balance: new BigNumber('10'),
    tokenId: mockCusdTokenId,
    priceUsd: new BigNumber('1'),
    networkId: NetworkId['celo-alfajores'],
    lastKnownPriceUsd: new BigNumber('1'),
    symbol: 'cUSD',
    address: mockCusdAddress,
    isFeeCurrency: true,
    canTransferWithComment: true,
    priceFetchedAt: Date.now(),
    decimals: 18,
    name: 'Celo Dollar',
    imageUrl: '',
  }

  it('tracks data about the asset when tapped', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} showPriceChangeIndicatorInBalances={true} />
      </Provider>
    )

    fireEvent.press(getByText('cUSD'))

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AssetsEvents.tap_asset, {
      address: mockCusdAddress,
      assetType: 'token',
      balanceUsd: 10,
      description: 'Celo Dollar',
      title: 'cUSD',
    })
  })
})
