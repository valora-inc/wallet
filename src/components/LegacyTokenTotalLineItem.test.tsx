import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import LegacyTokenTotalLineItem from 'src/components/LegacyTokenTotalLineItem'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { LocalAmount, NetworkId } from 'src/transactions/types'
import { createMockStore, getElementText } from 'test/utils'
import { mockCusdAddress, mockCusdTokenId } from 'test/values'

const mockBtcAddress = '0xbtc'
const mockBtcTokenId = `celo-alfajores:${mockBtcAddress}`

const defaultAmount = new BigNumber(10)
const defaultTokenAddress = mockCusdAddress

// This component is primarily tested via TokenTotalLineItem.test.tsx
describe('LegacyTokenTotalLineItem', () => {
  function renderComponent({
    amount = defaultAmount,
    tokenAddress = defaultTokenAddress,
    localAmount,
    localCurrencyCode = LocalCurrencyCode.BRL,
    usdToLocalRate = '1.5',
    feeToAddInUsd = undefined,
    hideSign = undefined,
  }: {
    amount?: BigNumber
    tokenAddress?: string
    localAmount?: LocalAmount
    localCurrencyCode?: LocalCurrencyCode
    usdToLocalRate?: string
    feeToAddInUsd?: BigNumber
    hideSign?: boolean
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
        <LegacyTokenTotalLineItem
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
      expect(getElementText(getByTestId('TotalLineItem/ExchangeRate'))).toEqual(
        'tokenExchanteRate, {"symbol":"cUSD"}R$1.50'
      )
      expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toEqual('10.00 cUSD')
    })
  })
})
