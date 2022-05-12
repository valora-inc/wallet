import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import { useAmountAsUsd, useLocalToTokenAmount, useTokenToLocalAmount } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

const tokenAddressWithPriceAndBalance = '0x001'
const tokenAddressWithoutBalance = '0x002'

function TestComponent({ tokenAddress }: { tokenAddress: string }) {
  const tokenAmount = useLocalToTokenAmount(new BigNumber(1), tokenAddress)
  const localAmount = useTokenToLocalAmount(new BigNumber(1), tokenAddress)
  const usdAmount = useAmountAsUsd(new BigNumber(1), tokenAddress)

  return (
    <View>
      <Text testID="tokenAmount">{tokenAmount?.toNumber()}</Text>
      <Text testID="localAmount">{localAmount?.toNumber()}</Text>
      <Text testID="usdAmount">{usdAmount?.toNumber()}</Text>
    </View>
  )
}

const store = (dollarExchange: string | null = '2') =>
  createMockStore({
    tokens: {
      tokenBalances: {
        [tokenAddressWithPriceAndBalance]: {
          symbol: 'T1',
          balance: '0',
          usdPrice: '5',
          priceFetchedAt: Date.now(),
        },
        [tokenAddressWithoutBalance]: {
          symbol: 'T2',
          usdPrice: '5',
          balance: null,
          priceFetchedAt: Date.now(),
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
  it('maps correctly if all the info is available', async () => {
    const { getByTestId } = render(
      <Provider store={store()}>
        <TestComponent tokenAddress={tokenAddressWithPriceAndBalance} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toEqual(0.1)
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toEqual(10)
    const usdAmount = getByTestId('usdAmount')
    expect(usdAmount.props.children).toEqual(5)
  })

  it('returns undefined if there is no balance set', async () => {
    const { getByTestId } = render(
      <Provider store={store()}>
        <TestComponent tokenAddress={tokenAddressWithoutBalance} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toBeUndefined()
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toBeUndefined()
    const usdAmount = getByTestId('usdAmount')
    expect(usdAmount.props.children).toBeUndefined()
  })

  it('returns undefined if there is no exchange rate', async () => {
    const { getByTestId } = render(
      <Provider store={store(null)}>
        <TestComponent tokenAddress={tokenAddressWithPriceAndBalance} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toBeUndefined()
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toBeUndefined()

    // USD amount doesn't use the exchange rate
    const usdAmount = getByTestId('usdAmount')
    expect(usdAmount.props.children).toEqual(5)
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
    const usdAmount = getByTestId('usdAmount')
    expect(usdAmount.props.children).toBeUndefined()
  })
})
