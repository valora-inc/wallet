import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AssetsEvents } from 'src/analytics/Events'
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
      name: 'CNDL Dollar',
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

    expect(getByText('CNDL Dollar')).toBeTruthy()
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

    expect(getByText('CNDL Dollar')).toBeTruthy()
    expect(queryByText('10.00 cUSD')).toBeFalsy()
    expect(queryByText('₱13.30')).toBeFalsy()
    expect(getByTestId('NetworkLabel')).toBeTruthy()
    expect(queryByTestId('BridgeLabel')).toBeFalsy()
  })

  it('displays correctly when token is bridged', () => {
    mockTokenInfo.bridge = 'Bridge V2'
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} />
      </Provider>
    )

    expect(getByText('CNDL Dollar')).toBeTruthy()
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

    expect(getByText('CNDL Dollar')).toBeTruthy()
    expect(getByText('10.00 cUSD')).toBeTruthy()
    expect(getByText('₱13.30')).toBeTruthy()
    expect(getByTestId('NetworkLabel')).toBeTruthy()
  })

  it('correctly triggers optional onPress prop', () => {
    const onPress = () => {
      AppAnalytics.track(AssetsEvents.tap_asset, {
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

    fireEvent.press(getByText('CNDL Dollar'))

    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(AssetsEvents.tap_asset, {
      assetType: 'token',
      tokenId: `celo-alfajores:${mockCusdAddress}`,
      networkId: mockTokenInfo.networkId,
      address: mockTokenInfo.address,
      balanceUsd: 10,
      description: 'CNDL Dollar',
      title: 'cUSD',
    })
  })
})
