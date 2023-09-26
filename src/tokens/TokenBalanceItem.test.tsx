import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { TokenBalance } from 'src/tokens/slice'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { createMockStore } from 'test/utils'
import { mockCusdAddress } from 'test/values'

let mockTokenInfo: TokenBalance

describe('TokenBalanceItem', () => {
  beforeEach(() => {
    mockTokenInfo = {
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
    } as any
  })

  it('displays correctly', () => {
    const { getByText, queryByTestId } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} />
      </Provider>
    )

    expect(getByText('Celo Dollar')).toBeTruthy()
    expect(getByText('10.00 cUSD')).toBeTruthy()
    expect(getByText('₱13.30')).toBeTruthy()
    expect(queryByTestId('BridgeLabel')).toBeFalsy()
    expect(queryByTestId('NetworkLabel')).toBeFalsy()
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
    mockTokenInfo.networkName = 'Celo'

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

  it('displays correctly when no usd price is available', () => {
    mockTokenInfo.usdPrice = null

    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} />
      </Provider>
    )

    expect(getByText('Celo Dollar')).toBeTruthy()
    expect(getByText('10.00 cUSD')).toBeTruthy()
    expect(getByText('--')).toBeTruthy()
  })
})
