import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import {
  useAmountAsUsd,
  useLocalToTokenAmount,
  useTokenToLocalAmount,
  useTokenPricesAreStale,
} from 'src/tokens/hooks'
import { createMockStore } from 'test/utils'
import { NetworkId } from 'src/transactions/types'

const tokenAddressWithPriceAndBalance = '0x001'
const tokenIdWithPriceAndBalance = `celo-alfajores:${tokenAddressWithPriceAndBalance}`
const tokenAddressWithoutBalance = '0x002'
const tokenIdWithoutBalance = `celo-alfajores:${tokenAddressWithoutBalance}`

function TestComponent({ tokenAddress }: { tokenAddress: string }) {
  const tokenAmount = useLocalToTokenAmount(new BigNumber(1), tokenAddress)
  const localAmount = useTokenToLocalAmount(new BigNumber(1), tokenAddress)
  const usdAmount = useAmountAsUsd(new BigNumber(1), tokenAddress)
  const tokenPricesAreStale = useTokenPricesAreStale([NetworkId['celo-alfajores']])

  return (
    <View>
      <Text testID="tokenAmount">{tokenAmount?.toNumber()}</Text>
      <Text testID="localAmount">{localAmount?.toNumber()}</Text>
      <Text testID="usdAmount">{usdAmount?.toNumber()}</Text>
      <Text testID="pricesStale">{tokenPricesAreStale}</Text>
    </View>
  )
}

const store = (usdToLocalRate: string | null, priceFetchedAt: number) =>
  createMockStore({
    tokens: {
      tokenBalances: {
        [tokenIdWithPriceAndBalance]: {
          address: tokenAddressWithPriceAndBalance,
          tokenId: tokenIdWithPriceAndBalance,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'T1',
          balance: '0',
          priceUsd: '5',
          priceFetchedAt,
        },
        [tokenIdWithoutBalance]: {
          address: tokenAddressWithoutBalance,
          tokenId: tokenIdWithoutBalance,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'T2',
          priceUsd: '5',
          balance: null,
          priceFetchedAt,
        },
      },
    },
    localCurrency: {
      usdToLocalRate,
    },
  })

describe('token to fiat exchanges', () => {
  it('maps correctly if all the info is available', async () => {
    const { getByTestId } = render(
      <Provider store={store('2', Date.now())}>
        <TestComponent tokenAddress={tokenAddressWithPriceAndBalance} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toEqual(0.1)
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toEqual(10)
    const usdAmount = getByTestId('usdAmount')
    expect(usdAmount.props.children).toEqual(5)
    const pricesStale = getByTestId('pricesStale')
    expect(pricesStale.props.children).toEqual(false)
  })

  it('returns undefined if there is no balance set', async () => {
    const { getByTestId } = render(
      <Provider store={store('2', Date.now())}>
        <TestComponent tokenAddress={tokenAddressWithoutBalance} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toBeUndefined()
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toBeUndefined()
    const usdAmount = getByTestId('usdAmount')
    expect(usdAmount.props.children).toBeUndefined()
    const pricesStale = getByTestId('pricesStale')
    expect(pricesStale.props.children).toEqual(false)
  })

  it('returns undefined if there is no exchange rate', async () => {
    const { getByTestId } = render(
      <Provider store={store(null, Date.now())}>
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
    const pricesStale = getByTestId('pricesStale')
    expect(pricesStale.props.children).toEqual(false)
  })

  it('returns undefined if the token doesnt exist', async () => {
    const { getByTestId } = render(
      <Provider store={store('2', Date.now())}>
        <TestComponent tokenAddress={'0x000'} />
      </Provider>
    )

    const tokenAmount = getByTestId('tokenAmount')
    expect(tokenAmount.props.children).toBeUndefined()
    const localAmount = getByTestId('localAmount')
    expect(localAmount.props.children).toBeUndefined()
    const usdAmount = getByTestId('usdAmount')
    expect(usdAmount.props.children).toBeUndefined()
    const pricesStale = getByTestId('pricesStale')
    expect(pricesStale.props.children).toEqual(false)
  })

  it('shows prices are stale', async () => {
    const { getByTestId } = render(
      <Provider store={store('2', Date.now() - 100000000)}>
        <TestComponent tokenAddress={tokenAddressWithPriceAndBalance} />
      </Provider>
    )

    const pricesStale = getByTestId('pricesStale')
    expect(pricesStale.props.children).toEqual(true)
  })
})
