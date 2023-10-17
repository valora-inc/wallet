import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'
import { NetworkId } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText, RecursivePartial } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
} from 'test/values'
jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => false),
}))

describe('LegacyTokenDisplay', () => {
  function store(storeOverrides?: RecursivePartial<RootState>) {
    return createMockStore({
      localCurrency: {
        usdToLocalRate: '0.10',
        preferredCurrencyCode: LocalCurrencyCode.BRL,
        fetchedCurrencyCode: LocalCurrencyCode.BRL,
      },
      tokens: {
        tokenBalances: {
          [mockCusdTokenId]: {
            address: mockCusdAddress,
            tokenId: mockCusdTokenId,
            symbol: 'cUSD',
            balance: '50',
            priceUsd: '1',
            networkId: NetworkId['celo-alfajores'],
            priceFetchedAt: Date.now(),
          },
          [mockCeurTokenId]: {
            address: mockCeurAddress,
            tokenId: mockCeurTokenId,
            symbol: 'cEUR',
            balance: '50',
            priceUsd: '1.2',
            networkId: NetworkId['celo-alfajores'],
            priceFetchedAt: Date.now(),
          },
          [mockCeloTokenId]: {
            address: mockCeloAddress,
            tokenId: mockCeloTokenId,
            symbol: 'CELO',
            balance: '10',
            priceUsd: '5',
            networkId: NetworkId['celo-alfajores'],
            priceFetchedAt: Date.now(),
          },
        },
      },
      ...storeOverrides,
    })
  }

  describe('when displaying tokens', () => {
    it('throws when both currency and tokenAddress are supplied', () => {
      expect(() =>
        render(
          <Provider store={store()}>
            <LegacyTokenDisplay
              showLocalAmount={false}
              amount={10}
              tokenAddress={mockCusdAddress}
              currency={Currency.Celo}
              testID="test"
            />
          </Provider>
        )
      ).toThrow()
    })
    it('throws when neither currency nor tokenAddress are supplied', () => {
      expect(() =>
        render(
          <Provider store={store()}>
            <LegacyTokenDisplay showLocalAmount={false} amount={10} testID="test" />
          </Provider>
        )
      ).toThrow()
    })
    it('shows token amount when showLocalAmount is false', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            showLocalAmount={false}
            amount={10}
            tokenAddress={mockCusdAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toBe('10.00 cUSD')
    })

    it('shows local amount when showLocalAmount is true', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            showLocalAmount={true}
            amount={10}
            tokenAddress={mockCusdAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('R$1.00')
    })

    it('shows local amount when showLocalAmount is true and token is not cUSD', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            showLocalAmount={true}
            amount={10}
            tokenAddress={mockCeloAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('R$5.00')
    })

    it('shows more decimals up to the', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            showLocalAmount={false}
            amount={0.00000182421}
            tokenAddress={mockCusdAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('0.0000018 cUSD')
    })

    it('hides the symbol when showSymbol is false', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            showLocalAmount={false}
            showSymbol={false}
            amount={10}
            tokenAddress={mockCusdAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toBe('10.00')
    })

    it('hides the fiat symbol when showSymbol is false', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            showLocalAmount={false}
            showSymbol={false}
            amount={10}
            tokenAddress={mockCusdAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('10.00')
    })

    it('uses the localAmount if set', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            amount={10}
            tokenAddress={mockCusdAddress}
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
          <LegacyTokenDisplay
            showLocalAmount={true}
            showExplicitPositiveSign={true}
            amount={10}
            tokenAddress={mockCusdAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('+R$1.00')
    })

    it('shows negative values', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            showLocalAmount={true}
            amount={-10}
            tokenAddress={mockCusdAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('-R$1.00')
    })

    it('shows a dash when the token doesnt exist', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay amount={10} tokenAddress={'0xdoesntexist'} testID="test" />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('-')
    })

    it('doesnt show error when the token doesnt exist if theres a localAmount', () => {
      const { getByTestId } = render(
        <Provider store={store()}>
          <LegacyTokenDisplay
            amount={10}
            tokenAddress={'0xdoesntexist'}
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
          <LegacyTokenDisplay
            showLocalAmount={true}
            hideSign={true}
            amount={-10}
            tokenAddress={mockCusdAddress}
            testID="test"
          />
        </Provider>
      )
      expect(getElementText(getByTestId('test'))).toEqual('R$1.00')
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
