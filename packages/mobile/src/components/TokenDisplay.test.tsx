import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import TokenDisplay from 'src/components/TokenDisplay'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'
import { amountFromComponent, createMockStore, RecursivePartial } from 'test/utils'

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
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay showLocalAmount={false} amount={10} tokenAddress={'0xusd'} testID="test" />
        </Provider>
      )
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('10.00 cUSD')
    })

    it('shows local amount when showLocalAmount is true', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay showLocalAmount={true} amount={10} tokenAddress={'0xusd'} testID="test" />
        </Provider>
      )
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('R$1.00')
    })

    it('shows local amount when showLocalAmount is true and token is not cUSD', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay showLocalAmount={true} amount={10} tokenAddress={'0xcelo'} testID="test" />
        </Provider>
      )
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('R$5.00')
    })

    it('hides the symbol when showSymbol is false', () => {
      const { getByTestId } = render(
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
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('10.00')
    })

    it('hides the fiat symbol when showSymbol is false', () => {
      const { getByTestId } = render(
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
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('10.00')
    })

    it('overrides local exchange rate with currency info', () => {
      const { getByTestId } = render(
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
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('₱25.00')
    })

    it('shows explicit plus sign', () => {
      const { getByTestId } = render(
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
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('+R$1.00')
    })

    it('shows negative values', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay showLocalAmount={true} amount={-10} tokenAddress={'0xusd'} testID="test" />
        </Provider>
      )
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('-R$1.00')
    })

    it('shows a dash when the token doesnt exist', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay amount={10} tokenAddress={'0xdoesntexist'} testID="test" />
        </Provider>
      )
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('R$-')
    })

    it('shows a dash when the token doesnt have a usd price', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay amount={10} tokenAddress={'0xnoUsdPrice'} testID="test" />
        </Provider>
      )
      expect(amountFromComponent(getByTestId('test/value'))).toEqual('R$-')
    })
  })
})
