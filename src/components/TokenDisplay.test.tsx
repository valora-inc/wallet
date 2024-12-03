import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import { APPROX_SYMBOL } from 'src/components/TokenEnterAmount'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'
import { NetworkId } from 'src/transactions/types'
import { createMockStore, getElementText, RecursivePartial } from 'test/utils'

describe('TokenDisplay', () => {
  function store(storeOverrides?: RecursivePartial<RootState>) {
    return createMockStore({
      localCurrency: {
        usdToLocalRate: '0.10',
        preferredCurrencyCode: LocalCurrencyCode.BRL,
        fetchedCurrencyCode: LocalCurrencyCode.BRL,
      },
      tokens: {
        tokenBalances: {
          ['celo-alfajores:0xusd']: {
            address: '0xusd',
            tokenId: 'celo-alfajores:0xusd',
            symbol: 'cUSD',
            balance: '50',
            priceUsd: '1',
            networkId: NetworkId['celo-alfajores'],
            priceFetchedAt: Date.now(),
          },
          ['celo-alfajores:0xeur']: {
            address: '0xeur',
            tokenId: 'celo-alfajores:0xeur',
            symbol: 'cEUR',
            balance: '50',
            priceUsd: '1.2',
            networkId: NetworkId['celo-alfajores'],
            priceFetchedAt: Date.now(),
          },
          ['ethereum-sepolia:native']: {
            tokenId: 'ethereum-sepolia:native',
            symbol: 'ETH',
            balance: '10',
            priceUsd: '5',
            networkId: NetworkId['ethereum-sepolia'],
            priceFetchedAt: Date.now(),
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
          <TokenDisplay
            showLocalAmount={false}
            amount={10}
            tokenId={'celo-alfajores:0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toBe('10.00 cUSD')
    })

    it('shows local amount when showLocalAmount is true', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={true}
            amount={10}
            tokenId={'celo-alfajores:0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('R$1.00')
    })

    it('shows local amount when showLocalAmount is true and token is not cUSD', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={true}
            amount={10}
            tokenId={'ethereum-sepolia:native'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('R$5.00')
    })

    it('shows more decimals up to the', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={false}
            amount={0.00000182421}
            tokenId={'celo-alfajores:0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('0.0000018 cUSD')
    })

    it('hides the symbol when showSymbol is false', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={false}
            showSymbol={false}
            amount={10}
            tokenId={'celo-alfajores:0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toBe('10.00')
    })

    it('hides the fiat symbol when showSymbol is false', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={false}
            showSymbol={false}
            amount={10}
            tokenId={'celo-alfajores:0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('10.00')
    })

    it('uses the localAmount if set', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            amount={10}
            tokenId={'ethereum-sepolia:native'}
            localAmount={{
              currencyCode: LocalCurrencyCode.PHP,
              exchangeRate: '0.5',
              value: '5',
            }}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('₱5.00')
    })

    it('shows explicit plus sign', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={true}
            showExplicitPositiveSign={true}
            amount={10}
            tokenId={'celo-alfajores:0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('+R$1.00')
    })

    it('shows negative values', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={true}
            amount={-10}
            tokenId={'celo-alfajores:0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('-R$1.00')
    })

    it('shows a dash by default when the token doesnt exist', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay amount={10} tokenId={'celo-alfajores:does-not-exist'} testID="test" />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('-')
    })

    it('shows custom error fallback when token doesnt exist and fallback is provided', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            amount={10}
            tokenId={'celo-alfajores:does-not-exist'}
            testID="test"
            errorFallback="$ --"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('$ --')
    })

    it('doesnt show error when the token doesnt exist if theres a localAmount', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            amount={10}
            tokenId={'celo-alfajores:does-not-exist'}
            localAmount={{
              currencyCode: LocalCurrencyCode.PHP,
              exchangeRate: '0.5',
              value: '5',
            }}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('₱5.00')
    })

    it('hides the sign', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={true}
            hideSign={true}
            amount={-10}
            tokenId={'celo-alfajores:0xusd'}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('R$1.00')
    })

    it('shows approx sign if set', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <TokenDisplay
            showLocalAmount={false}
            amount={10}
            tokenId={'celo-alfajores:0xusd'}
            showApprox={true}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual(`${APPROX_SYMBOL} 10.00 cUSD`)
    })
  })
})

describe('formatValueToDisplay', () => {
  it('adds at least two decimal places', () => {
    expect(formatValueToDisplay(new BigNumber(1234))).toEqual('1,234.00')
  })

  it('shows at least two significant figures', () => {
    expect(formatValueToDisplay(new BigNumber(0.00000012345))).toEqual('0.00000012')
  })

  it('does not show trailing zeros', () => {
    expect(formatValueToDisplay(new BigNumber(0.01))).toEqual('0.01')
  })
})
