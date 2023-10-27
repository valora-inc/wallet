import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useState } from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import FeeDrawer from 'src/components/FeeDrawer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { NetworkId } from 'src/transactions/types'
import { createMockStore, getElementText } from 'test/utils'
import { mockCeloAddress, mockCeloTokenId, mockCusdAddress, mockCusdTokenId } from 'test/values'

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
}))

jest.mocked(useState).mockReturnValue([true, jest.fn()])

describe('FeeDrawer', () => {
  function renderComponent({
    isEstimate = true,
    isExchange = false,
    securityFee = new BigNumber(0.005),
    exchangeFee = undefined,
    showDekfee = false,
    dekFee = new BigNumber(0.002),
    feeLoading = false,
    feeHasError = false,
    totalFee = new BigNumber(0.007),
    testID = 'feeDrawer/SendConfirmation',
    showLocalAmount = false,
    tokenId = mockCeloTokenId,
  }: {
    isEstimate?: boolean
    isExchange?: boolean
    securityFee?: BigNumber
    exchangeFee?: BigNumber
    dekFee?: BigNumber
    showDekfee?: boolean
    feeLoading?: boolean
    feeHasError?: boolean
    totalFee?: BigNumber
    testID?: string
    showLocalAmount?: boolean
    tokenId?: string
  }) {
    return render(
      <Provider
        store={createMockStore({
          localCurrency: {
            preferredCurrencyCode: LocalCurrencyCode.BRL,
            fetchedCurrencyCode: LocalCurrencyCode.BRL,
            usdToLocalRate: '0.10',
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
              [mockCeloTokenId]: {
                networkId: NetworkId['celo-alfajores'],
                address: mockCeloAddress,
                tokenId: mockCeloTokenId,
                symbol: 'CELO',
                priceUsd: '0.5',
                balance: '100',
                priceFetchedAt: Date.now(),
              },
            },
          },
        })}
      >
        <FeeDrawer
          isEstimate={isEstimate}
          isExchange={isExchange}
          securityFee={securityFee}
          exchangeFee={exchangeFee}
          showDekfee={showDekfee}
          dekFee={dekFee}
          feeLoading={feeLoading}
          feeHasError={feeHasError}
          totalFee={totalFee}
          testID={testID}
          showLocalAmount={showLocalAmount}
          tokenId={tokenId}
        />
      </Provider>
    )
  }

  describe('When rendering normally', () => {
    it('shows total fee and security fee', () => {
      const { getByTestId } = renderComponent({})
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/totalFee'))).toEqual(
        '0.007 CELO'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/securityFee'))).toEqual(
        '0.005 CELO'
      )
    })
    it('shows total fee, security fee and dek fee', () => {
      const { getByTestId } = renderComponent({ showDekfee: true })
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/totalFee'))).toEqual(
        '0.007 CELO'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/securityFee'))).toEqual(
        '0.005 CELO'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/dekFee'))).toEqual('0.002 CELO')
    })
    it('shows total fee, security fee, exchange fee', () => {
      const { getByTestId } = renderComponent({
        isExchange: true,
        exchangeFee: new BigNumber(0.001),
      })
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/totalFee'))).toEqual(
        '0.007 CELO'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/securityFee'))).toEqual(
        '0.005 CELO'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/exchangeFee'))).toEqual(
        '0.001 CELO'
      )
    })
    it('shows total fee, security fee, dek fee and exchange fee in local cUSD', () => {
      const { getByTestId } = renderComponent({
        tokenId: mockCusdTokenId,
        showDekfee: true,
        isExchange: true,
        exchangeFee: new BigNumber(0.001),
      })
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/totalFee'))).toEqual(
        '0.007 cUSD'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/securityFee'))).toEqual(
        '0.005 cUSD'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/dekFee'))).toEqual('0.002 cUSD')
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/exchangeFee'))).toEqual(
        '0.001 cUSD'
      )
    })
    it('shows total fee, security fee, dek fee and exchange fee in local amount', () => {
      const { getByTestId } = renderComponent({
        showLocalAmount: true,
        showDekfee: true,
        isExchange: true,
        exchangeFee: new BigNumber(0.001),
      })
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/totalFee'))).toEqual(
        'R$0.00035'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/securityFee'))).toEqual(
        'R$0.00025'
      )
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/dekFee'))).toEqual('R$0.0001')
      expect(getElementText(getByTestId('feeDrawer/SendConfirmation/exchangeFee'))).toEqual(
        'R$0.00005'
      )
    })
  })
})
