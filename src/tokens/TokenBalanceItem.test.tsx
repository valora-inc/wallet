import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { createMockStore } from 'test/utils'
import { mockCusdAddress } from 'test/values'

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

  it('displays correctly', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <TokenBalanceItem token={mockTokenInfo} />
      </Provider>
    )

    expect(getByText('Celo Dollar')).toBeTruthy()
    expect(getByText('10.00 cUSD')).toBeTruthy()
    expect(getByText('₱13.30')).toBeTruthy()
    expect(getByText('Celo Network')).toBeTruthy()
  })
})
