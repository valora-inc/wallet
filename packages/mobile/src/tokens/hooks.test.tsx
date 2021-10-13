import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import { useLocalToTokenAmount, useTokenToLocalAmount } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

const tokenAddressWithPrice = '0x123'
const tokenAddressWithoutPrice = '0x124'

function TestComponent({ tokenAddress }: { tokenAddress: string }) {
  const tokenAmount = useLocalToTokenAmount(new BigNumber(1), tokenAddress)
  const localAmount = useTokenToLocalAmount(new BigNumber(1), tokenAddress)

  return (
    <View>
      <Text testID="tokenAmount">{tokenAmount?.toNumber()}</Text>
      <Text testID="localAmount">{localAmount?.toNumber()}</Text>
    </View>
  )
}

const store = (dollarExchange: string | null = '2') =>
  createMockStore({
    tokens: {
      tokenBalances: {
        [tokenAddressWithPrice]: {
          symbol: 'T1',
          usdPrice: '5',
        },
        [tokenAddressWithoutPrice]: {
          symbol: 'T2',
        },
      },
    },
    localCurrency: {
      exchangeRates: {
        [Currency.Dollar]: dollarExchange,
      },
    },
  })

describe('token to fiat exchanges', () => {
  it('maps from fiat currency to token amount', async () => {
    const { getByTestId } = render(
      <Provider store={store()}>
        <TestComponent tokenAddress={tokenAddressWithPrice} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toEqual(0.1)
  })

  it('maps from token amount to fiat currency', async () => {
    const { getByTestId } = render(
      <Provider store={store()}>
        <TestComponent tokenAddress={tokenAddressWithPrice} />
      </Provider>
    )

    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toEqual(10)
  })

  it('returns undefined if there is no token price', async () => {
    const { getByTestId } = render(
      <Provider store={store()}>
        <TestComponent tokenAddress={tokenAddressWithoutPrice} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toBeUndefined()
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toBeUndefined()
  })

  it('returns undefined if there is no exchange rate', async () => {
    const { getByTestId } = render(
      <Provider store={store(null)}>
        <TestComponent tokenAddress={tokenAddressWithPrice} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toBeUndefined()
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toBeUndefined()
  })

  it('returns undefined if the token doesnt exist', async () => {
    const { getByTestId } = render(
      <Provider store={store()}>
        <TestComponent tokenAddress={'0x000'} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toBeUndefined()
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toBeUndefined()
  })
})
