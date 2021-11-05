import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import { getHigherBalanceCurrency, useIsCoreToken } from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockTestTokenAddress,
} from 'test/values'

describe(getHigherBalanceCurrency, () => {
  it('should return the currency with the higher balance in the local currency', () => {
    const balances = {
      [Currency.Dollar]: new BigNumber(1),
      [Currency.Euro]: new BigNumber(1),
      [Currency.Celo]: new BigNumber(1),
    }
    const exchangesRates = {
      [Currency.Dollar]: '1',
      [Currency.Euro]: '2',
      [Currency.Celo]: '3',
    }

    expect(
      getHigherBalanceCurrency(
        [Currency.Dollar, Currency.Euro, Currency.Celo],
        balances,
        exchangesRates
      )
    ).toEqual('cGLD')
    expect(
      getHigherBalanceCurrency([Currency.Dollar, Currency.Euro], balances, exchangesRates)
    ).toEqual('cEUR')
    expect(getHigherBalanceCurrency([Currency.Dollar], balances, exchangesRates)).toEqual('cUSD')
  })

  it('should return `undefined` when balances are `null`', () => {
    const balances = {
      [Currency.Dollar]: null,
      [Currency.Euro]: null,
      [Currency.Celo]: null,
    }
    const exchangesRates = {
      [Currency.Dollar]: '1',
      [Currency.Euro]: '2',
      [Currency.Celo]: '3',
    }

    expect(
      getHigherBalanceCurrency([Currency.Dollar, Currency.Euro], balances, exchangesRates)
    ).toEqual(undefined)
  })

  it('should return `undefined` when exchange rates are `null`', () => {
    const balances = {
      [Currency.Dollar]: new BigNumber(1),
      [Currency.Euro]: new BigNumber(1),
      [Currency.Celo]: new BigNumber(1),
    }
    const exchangesRates = {
      [Currency.Dollar]: null,
      [Currency.Euro]: null,
      [Currency.Celo]: null,
    }

    expect(
      getHigherBalanceCurrency([Currency.Dollar, Currency.Euro], balances, exchangesRates)
    ).toEqual(undefined)
  })
})

describe('token to fiat exchanges', () => {
  function TestComponent({ tokenAddress }: { tokenAddress: string }) {
    const isCoreToken = useIsCoreToken(tokenAddress)

    return (
      <View>
        <Text testID="isCoreToken">{isCoreToken}</Text>
      </View>
    )
  }

  it('cUSD, cEUR and CELO are core tokens', async () => {
    ;[mockCusdAddress, mockCeurAddress, mockCeloAddress].map((tokenAddress) => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <TestComponent tokenAddress={tokenAddress} />
        </Provider>
      )

      const tokenAmount = getByTestId('isCoreToken')
      expect(tokenAmount.props.children).toEqual(true)
    })
  })

  it('TT is not a core token', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <TestComponent tokenAddress={mockTestTokenAddress} />
      </Provider>
    )

    const tokenAmount = getByTestId('isCoreToken')
    expect(tokenAmount.props.children).toEqual(false)
  })
})
