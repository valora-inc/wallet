import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { APPROX_SYMBOL } from 'src/components/TokenEnterAmount'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { LocalAmount, NetworkId } from 'src/transactions/types'
import { createMockStore, getElementText } from 'test/utils'
import { mockCusdAddress, mockCusdTokenId } from 'test/values'

const mockBtcAddress = '0xbtc'
const mockBtcTokenId = `celo-alfajores:${mockBtcAddress}`

const defaultAmount = new BigNumber(10)
const defaultTokenId = mockCusdTokenId

describe('TokenTotalLineItem', () => {
  function renderComponent({
    amount = defaultAmount,
    tokenId = defaultTokenId,
    localAmount,
    usdToLocalRate = '1.5',
    feeToAddInUsd = undefined,
    hideSign = undefined,
    showLocalAmountForTotal = true,
    newSendScreen = false,
  }: {
    amount?: BigNumber
    tokenId?: string
    localAmount?: LocalAmount
    usdToLocalRate?: string
    feeToAddInUsd?: BigNumber
    hideSign?: boolean
    showLocalAmountForTotal?: boolean
    newSendScreen?: boolean
  }) {
    return render(
      <Provider
        store={createMockStore({
          localCurrency: {
            preferredCurrencyCode: LocalCurrencyCode.BRL,
            fetchedCurrencyCode: LocalCurrencyCode.BRL,
            usdToLocalRate,
          },
          tokens: {
            tokenBalances: {
              [mockCusdTokenId]: {
                networkId: NetworkId['celo-alfajores'],
                address: mockCusdAddress,
                tokenId: mockCusdTokenId,
                symbol: 'cUSD',
                priceUsd: '1',
                balance: '10',
                priceFetchedAt: Date.now(),
              },
              [mockBtcTokenId]: {
                networkId: NetworkId['celo-alfajores'],
                address: mockBtcAddress,
                tokenId: mockBtcTokenId,
                symbol: 'WBTC',
                priceUsd: '65000',
                balance: '0.5',
                priceFetchedAt: Date.now(),
              },
            },
          },
        })}
      >
        <TokenTotalLineItem
          tokenAmount={amount}
          tokenId={tokenId}
          localAmount={localAmount}
          feeToAddInUsd={feeToAddInUsd}
          hideSign={hideSign}
          showLocalAmountForTotal={showLocalAmountForTotal}
          showApproxTotalBalance={newSendScreen}
          showApproxExchangeRate={newSendScreen}
        />
      </Provider>
    )
  }

  describe('When rendering normally', () => {
    it('shows the right amounts', () => {
      const { getByTestId } = renderComponent({})
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$15.00')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchanteRate, {"symbol":"cUSD"}R$1.50'
      )
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })

  describe('When rendering with many decimals', () => {
    it('rounds appropiately', () => {
      const { getByTestId } = renderComponent({
        usdToLocalRate: '1.333333333333333333',
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$13.33')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchanteRate, {"symbol":"cUSD"}R$1.33'
      )
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })

  describe('When rendering a low value', () => {
    it('we show some significant values', () => {
      const { getByTestId } = renderComponent({
        amount: new BigNumber(0.000123456),
        tokenId: mockBtcTokenId,
        usdToLocalRate: '1',
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$8.02')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchanteRate, {"symbol":"WBTC"}R$65,000.00'
      )
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('0.00012 WBTC')
    })
  })

  describe('When pasing the fee to add in USD', () => {
    it('adds the fee to the total', () => {
      const { getByTestId } = renderComponent({
        feeToAddInUsd: new BigNumber(0.12),
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$15.18')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchanteRate, {"symbol":"cUSD"}R$1.50'
      )
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.12 cUSD')
    })
  })

  describe('When sending hideSign as true', () => {
    it('doesnt show the sign', () => {
      const { getByTestId } = renderComponent({
        amount: defaultAmount.times(-1),
        hideSign: true,
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual('R$15.00')
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchanteRate, {"symbol":"cUSD"}R$1.50'
      )
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
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchanteRate, {"symbol":"cUSD"}€0.50'
      )
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })

  describe('When total is shown in crypto currency', () => {
    it('shows approx total in crypto, new exchange rate, conversion in fiat, with fee', () => {
      const { getByTestId } = renderComponent({
        feeToAddInUsd: new BigNumber(0.5),
        showLocalAmountForTotal: false,
        newSendScreen: true,
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual(
        `${APPROX_SYMBOL} 10.50 cUSD`
      )
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchangeRateApprox, {"symbol":"cUSD"}R$1.50'
      )
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('R$15.75')
    })
    it('shows approx total in crypto without fee', () => {
      const { getByTestId } = renderComponent({
        showLocalAmountForTotal: false,
        newSendScreen: true,
      })
      expect(getElementText(getByTestId('TotalLineItem/Total'))).toEqual(
        `${APPROX_SYMBOL} 10.00 cUSD`
      )
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchangeRateApprox, {"symbol":"cUSD"}R$1.50'
      )
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('R$15.00')
    })
  })
})
