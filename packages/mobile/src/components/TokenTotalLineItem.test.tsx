import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { LocalAmount } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText } from 'test/utils'
import { mockCusdAddress } from 'test/values'

const mockBtcAddress = '0xbtc'

const defaultAmount = new BigNumber(10)
const defaultTokenAddress = mockCusdAddress

describe('TokenTotalLineItem', () => {
  function renderComponent({
    amount = defaultAmount,
    tokenAddress = defaultTokenAddress,
    localAmount,
    localCurrencyCode = LocalCurrencyCode.BRL,
    localCurrencyExchangeRate = '1.5',
    feeToAddInUsd = undefined,
    hideSign = undefined,
  }: {
    amount?: BigNumber
    tokenAddress?: string
    localAmount?: LocalAmount
    localCurrencyCode?: LocalCurrencyCode
    localCurrencyExchangeRate?: string
    feeToAddInUsd?: BigNumber
    hideSign?: boolean
  }) {
    return render(
      <Provider
        store={createMockStore({
          localCurrency: {
            preferredCurrencyCode: LocalCurrencyCode.BRL,
            fetchedCurrencyCode: LocalCurrencyCode.BRL,
            exchangeRates: { [Currency.Dollar]: localCurrencyExchangeRate },
          },
          tokens: {
            tokenBalances: {
              [mockCusdAddress]: {
                symbol: 'cUSD',
                usdPrice: '1',
                balance: '10',
                priceFetchedAt: Date.now(),
              },
              [mockBtcAddress]: {
                symbol: 'WBTC',
                usdPrice: '65000',
                balance: '0.5',
                priceFetchedAt: Date.now(),
              },
            },
          },
        })}
      >
        <TokenTotalLineItem
          tokenAmount={amount}
          tokenAddress={tokenAddress}
          localAmount={localAmount}
          feeToAddInUsd={feeToAddInUsd}
          hideSign={hideSign}
        />
      </Provider>
    )
  }

  describe('When rendering normally', () => {
    it('shows the right amounts', () => {
      const { getByTestId } = renderComponent({})
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$15.00')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual('R$1.50')
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })

  describe('When rendering with many decimals', () => {
    it('rounds appropiately', () => {
      const { getByTestId } = renderComponent({
        localCurrencyExchangeRate: '1.333333333333333333',
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$13.33')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual('R$1.33')
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })

  describe('When rendering a low value', () => {
    it('we show some significant values', () => {
      const { getByTestId } = renderComponent({
        amount: new BigNumber(0.000123456),
        tokenAddress: mockBtcAddress,
        localCurrencyExchangeRate: '1',
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$8.02')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual('R$65,000.00')
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('0.00012 WBTC')
    })
  })

  describe('When pasing the fee to add in USD', () => {
    it('adds the fee to the total', () => {
      const { getByTestId } = renderComponent({
        feeToAddInUsd: new BigNumber(0.12),
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$15.18')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual('R$1.50')
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })

  describe('When sending hideSign as true', () => {
    it('doesnt show the sign', () => {
      const { getByTestId } = renderComponent({
        amount: defaultAmount.times(-1),
        hideSign: true,
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$15.00')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual('R$1.50')
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })

  describe('When sending a localAmount', () => {
    it('uses the exchange rate and value in it', () => {
      const { getByTestId } = renderComponent({
        amount: defaultAmount,
        localAmount: {
          value: '5',
          exchangeRate: '0.5',
          currencyCode: 'EUR',
        },
        hideSign: true,
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('€5.00')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual('€0.50')
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })
})
