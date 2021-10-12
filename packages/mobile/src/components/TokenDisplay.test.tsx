import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import TokenDisplay from 'src/components/TokenDisplay'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'
import { createMockStore, RecursivePartial } from 'test/utils'

describe('TokenDisplay', () => {
  function store(storeOverrides?: RecursivePartial<RootState>) {
    return createMockStore({
      localCurrency: {
        exchangeRates: { [Currency.Dollar]: '0.10' },
        preferredCurrencyCode: LocalCurrencyCode.BRL,
        fetchedCurrencyCode: LocalCurrencyCode.BRL,
      },
      tokens: {
        tokenBalances: {
          ['0xusd']: {
            address: '0xusd',
            symbol: 'cUSD',
            balance: '50',
            usdPrice: '1',
          },
          ['0xeur']: {
            address: '0xeur',
            symbol: 'cEUR',
            balance: '50',
            usdPrice: '1.2',
          },
          ['0xcelo']: {
            address: '0xcelo',
            symbol: 'CELO',
            balance: '10',
            usdPrice: '5',
          },
          ['0xnoUsdPrice']: {
            address: '0xnoUsdPrice',
            symbol: 'NoUsd',
            balance: '10',
          },
        },
      },
      ...storeOverrides,
    })
  }

  describe('when displaying tokens', () => {
    it('shows token amount when showLocalAmount is false', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay showLocalAmount={false} amount={10} tokenAddress={'0xusd'} testID="test" />
        </Provider>
      )
      expect(getByText('10.00 cUSD').props.testID).toBe('test')
    })

    it('shows local amount when showLocalAmount is true', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay showLocalAmount={true} amount={10} tokenAddress={'0xusd'} testID="test" />
        </Provider>
      )
      expect(getByText('R$1.00').props.testID).toEqual('test')
    })

    it('shows local amount when showLocalAmount is true and token is not cUSD', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay showLocalAmount={true} amount={10} tokenAddress={'0xcelo'} testID="test" />
        </Provider>
      )
      expect(getByText('R$5.00').props.testID).toEqual('test')
    })

    it('hides the symbol when showSymbol is false', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={false}
            showSymbol={false}
            amount={10}
            tokenAddress={'0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getByText('10.00').props.testID).toBe('test')
    })

    it('hides the fiat symbol when showSymbol is false', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={false}
            showSymbol={false}
            amount={10}
            tokenAddress={'0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getByText('10.00').props.testID).toEqual('test')
    })

    it('overrides local exchange rate with currency info', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay
            amount={10}
            tokenAddress={'0xcelo'}
            currencyInfo={{
              localCurrencyCode: LocalCurrencyCode.PHP,
              localExchangeRate: '0.5',
            }}
            testID="test"
          />
        </Provider>
      )
      expect(getByText('₱25.00').props.testID).toEqual('test')
    })

    it('shows explicit plus sign', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={true}
            showExplicitPositiveSign={true}
            amount={10}
            tokenAddress={'0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getByText('+R$1.00').props.testID).toEqual('test')
    })

    it('shows negative values', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay showLocalAmount={true} amount={-10} tokenAddress={'0xusd'} testID="test" />
        </Provider>
      )
      expect(getByText('-R$1.00').props.testID).toEqual('test')
    })

    it('shows a dash when the token doesnt exist', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay amount={10} tokenAddress={'0xdoesntexist'} testID="test" />
        </Provider>
      )
      expect(getByText('R$-').props.testID).toEqual('test')
    })

    it('shows a dash when the token doesnt have a usd price', () => {
      const { getByText } = render(
        <Provider store={store()}>
          <TokenDisplay amount={10} tokenAddress={'0xnoUsdPrice'} testID="test" />
        </Provider>
      )
      expect(getByText('R$-').props.testID).toEqual('test')
    })
  })
})
