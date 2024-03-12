import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenBalance } from 'src/tokens/slice'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { createMockStore } from 'test/utils'
import { mockCusdAddress } from 'test/values'

let mockTokenInfo: TokenBalance

describe('TokenBalanceItem', () => {
  beforeEach(() => {
    mockTokenInfo = {
      balance: new BigNumber('10'),
      priceUsd: new BigNumber('1'),
      lastKnownPriceUsd: new BigNumber('1'),
      symbol: 'cUSD',
      isFeeCurrency: true,
      canTransferWithComment: true,
      priceFetchedAt: Date.now(),
      decimals: 18,
      name: 'Celo Dollar',
      imageUrl: '',
      tokenId: `celo-alfajores:${mockCusdAddress}`,
      networkId: 'celo-alfajores',
    } as any
  })

  it('displays correctly', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} />
      </Provider>
    )

    expect(getByText('Celo Dollar')).toBeTruthy()
    expect(getByText('10.00 cUSD')).toBeTruthy()
    expect(getByText('₱13.30')).toBeTruthy()
    expect(getByTestId('NetworkLabel')).toBeTruthy()
    expect(queryByTestId('BridgeLabel')).toBeFalsy()
  })

  it('displays correctly when balances are hidden', () => {
    const { getByText, getByTestId, queryByTestId, queryByText } = render(
      <Provider store={createMockStore()}>
        <TokenBalanceItem token={mockTokenInfo} hideBalances={true} />
      </Provider>
    )

    expect(getByText('Celo Dollar')).toBeTruthy()
    expect(queryByText('10.00 cUSD')).toBeFalsy()
    expect(queryByText('₱13.30')).toBeFalsy()
    expect(getByTestId('NetworkLabel')).toBeTruthy()
    expect(queryByTestId('BridgeLabel')).toBeFalsy()
  })

  it('displays correctly when token is bridged', () => {
    mockTokenInfo.bridge = 'Valora Bridge V2'
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} />
      </Provider>
    )

    expect(getByText('Celo Dollar')).toBeTruthy()
    expect(getByText('10.00 cUSD')).toBeTruthy()
    expect(getByText('₱13.30')).toBeTruthy()
    expect(getByTestId('BridgeLabel')).toBeTruthy()
  })

  it('displays correctly when the token network is provided', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} />
      </Provider>
    )

    expect(getByText('Celo Dollar')).toBeTruthy()
    expect(getByText('10.00 cUSD')).toBeTruthy()
    expect(getByText('₱13.30')).toBeTruthy()
    expect(getByTestId('NetworkLabel')).toBeTruthy()
  })

  it('correctly triggers optional onPress prop', () => {
    const onPress = () => {
      ValoraAnalytics.track(AssetsEvents.tap_asset, {
        assetType: 'token',
        tokenId: mockTokenInfo.tokenId,
        networkId: mockTokenInfo.networkId,
        address: mockTokenInfo.address,
        title: mockTokenInfo.symbol,
        description: mockTokenInfo.name,
        balanceUsd: mockTokenInfo.balance.multipliedBy(mockTokenInfo.priceUsd ?? 0).toNumber(),
      })
    }

    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} onPress={onPress} />
      </Provider>
    )

    fireEvent.press(getByText('Celo Dollar'))

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AssetsEvents.tap_asset, {
      assetType: 'token',
      tokenId: `celo-alfajores:${mockCusdAddress}`,
      networkId: mockTokenInfo.networkId,
      address: mockTokenInfo.address,
      balanceUsd: 10,
      description: 'Celo Dollar',
      title: 'cUSD',
    })
  })
})
