import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import TokenBalancesScreen from 'src/tokens/TokenBalances'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import {
  mockTestTokenAddress,
  mockTokenBalances,
  mockTokenBalancesWithHistoricalPrices,
} from 'test/values'

const storeWithoutHistoricalPrices = {
  tokens: {
    tokenBalances: {
      ...mockTokenBalances,
      [mockTestTokenAddress]: {
        address: mockTestTokenAddress,
        symbol: 'TT',
        balance: '50',
      },
    },
  },
  app: {
    showPriceChangeIndicatorInBalances: false,
  },
}

const storeWithHistoricalPrices = {
  tokens: {
    tokenBalances: {
      ...mockTokenBalancesWithHistoricalPrices,
      [mockTestTokenAddress]: {
        address: mockTestTokenAddress,
        symbol: 'TT',
        balance: '50',
        usdPrice: '2',
        priceFetchedAt: Date.now(),
        historicalUsdPrices: {
          lastDay: {
            price: '1.3',
            at: Date.now() - ONE_DAY_IN_MILLIS,
          },
        },
      },
    },
  },
  app: {
    showPriceChangeIndicatorInBalances: true,
  },
}

const mockScreenProps = getMockStackScreenProps(Screens.TokenBalances)

describe('TokenBalancesScreen', () => {
  it('renders correctly when showPriceChangeIndicator ff is off', async () => {
    const store = createMockStore(storeWithoutHistoricalPrices)

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('tokenBalance:POOF'))).toBe('5.00')
    expect(getElementText(tree.getByTestId('tokenLocalBalance:POOF'))).toBe('₱0.67')

    expect(getElementText(tree.getByTestId('tokenBalance:TT'))).toBe('50.00')
    expect(tree.queryByTestId('tokenLocalBalance:TT')).toBeFalsy()

    expect(tree.queryByTestId('percentageIndicator:POOF')).toBeFalsy()
    expect(tree.queryByTestId('percentageIndicator:TT')).toBeFalsy()
  })

  it('renders correctly when showPriceChangeIndicator ff is on', async () => {
    const store = createMockStore(storeWithHistoricalPrices)

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('tokenBalance:POOF'))).toBe('5.00')
    expect(getElementText(tree.getByTestId('tokenLocalBalance:POOF'))).toBe('₱0.67')

    expect(getElementText(tree.getByTestId('percentageIndicator:POOF'))).toBe('33.33%')
    expect(tree.queryByTestId('percentageIndicator:POOF:DownIndicator')).toBeTruthy()

    expect(getElementText(tree.getByTestId('percentageIndicator:TT'))).toBe('53.85%')
    expect(tree.queryByTestId('percentageIndicator:TT:UpIndicator')).toBeTruthy()
  })
})
