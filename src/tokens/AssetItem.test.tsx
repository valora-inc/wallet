import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PositionItem, TokenBalanceItem } from 'src/tokens/AssetItem'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockPositions } from 'test/values'

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
})

describe('TokenBalanceItem', () => {
  const mockTokenInfo = {
    balance: new BigNumber('10'),
    usdPrice: new BigNumber('1'),
    lastKnownUsdPrice: new BigNumber('1'),
    symbol: 'cUSD',
    address: mockCusdAddress,
    isCoreToken: true,
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
