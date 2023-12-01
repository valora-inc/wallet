import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import { getDynamicConfigParams } from 'src/statsig'
import {
  useAmountAsUsd,
  useCashInTokens,
  useCashOutTokens,
  useLocalToTokenAmount,
  useSwappableTokens,
  useTokenPricesAreStale,
  useTokenToLocalAmount,
  useTokensForSend,
} from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockCeloTokenId,
  mockCeurTokenId,
  mockCrealTokenId,
  mockCusdTokenId,
  mockPoofTokenId,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn(() => {
    return {
      showCico: ['celo-alfajores'],
      showSend: ['celo-alfajores'],
      showSwap: ['celo-alfajores'],
      showBalances: ['celo-alfajores'],
    }
  }),
  getFeatureGate: jest.fn().mockReturnValue(true),
}))

const tokenAddressWithPriceAndBalance = '0x001'
const tokenIdWithPriceAndBalance = `celo-alfajores:${tokenAddressWithPriceAndBalance}`
const tokenAddressWithoutBalance = '0x002'
const tokenIdWithoutBalance = `celo-alfajores:${tokenAddressWithoutBalance}`
const ethTokenId = 'ethereum-sepolia:native'

function TestComponent({ tokenId }: { tokenId: string }) {
  const tokenAmount = useLocalToTokenAmount(new BigNumber(1), tokenId)
  const localAmount = useTokenToLocalAmount(new BigNumber(1), tokenId)
  const usdAmount = useAmountAsUsd(new BigNumber(1), tokenId)
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

function TokenHookTestComponent({ hook }: { hook: () => TokenBalance[] }) {
  const tokens = hook()

  return <Text testID="tokenIDs">{tokens.map((token) => token.tokenId)}</Text>
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

const storeWithMultipleNetworkTokens = () =>
  createMockStore({
    tokens: {
      tokenBalances: {
        ...mockTokenBalances,
        [mockCrealTokenId]: {
          ...mockTokenBalances[mockCrealTokenId],
          balance: '1',
          minimumAppVersionToSwap: '1.0.0',
        },
        [mockCeloTokenId]: {
          ...mockTokenBalances[mockCeloTokenId],
          balance: '1',
          isSwappable: true,
        },
        [ethTokenId]: {
          tokenId: ethTokenId,
          symbol: 'ETH',
          balance: '10',
          priceUsd: '5',
          networkId: NetworkId['ethereum-sepolia'],
          priceFetchedAt: Date.now(),
          isCashInEligible: true,
          isCashOutEligible: true,
          minimumAppVersionToSwap: '0.0.1',
        },
      },
    },
  })

describe('token to fiat exchanges', () => {
  it('maps correctly if all the info is available', async () => {
    const { getByTestId } = render(
      <Provider store={store('2', Date.now())}>
        <TestComponent tokenId={tokenIdWithPriceAndBalance} />
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
        <TestComponent tokenId={tokenIdWithoutBalance} />
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
        <TestComponent tokenId={tokenIdWithPriceAndBalance} />
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
        <TestComponent tokenId={'0x000'} />
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
        <TestComponent tokenId={tokenIdWithPriceAndBalance} />
      </Provider>
    )

    const pricesStale = getByTestId('pricesStale')
    expect(pricesStale.props.children).toEqual(true)
  })
})

describe('useTokensForSend', () => {
  it('returns tokens with balance', () => {
    const { getByTestId } = render(
      <Provider store={storeWithMultipleNetworkTokens()}>
        <TokenHookTestComponent hook={useTokensForSend} />
      </Provider>
    )

    expect(getByTestId('tokenIDs').props.children).toEqual([
      mockPoofTokenId,
      mockCeloTokenId,
      mockCrealTokenId,
    ])
  })

  it('returns tokens with balance for multiple networks', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showSend: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
    })
    const { getByTestId } = render(
      <Provider store={storeWithMultipleNetworkTokens()}>
        <TokenHookTestComponent hook={useTokensForSend} />
      </Provider>
    )

    expect(getByTestId('tokenIDs').props.children).toEqual([
      mockPoofTokenId,
      mockCeloTokenId,
      mockCrealTokenId,
      ethTokenId,
    ])
  })
})

describe('useSwappableTokens', () => {
  it('returns tokens with balance', () => {
    const { getByTestId } = render(
      <Provider store={storeWithMultipleNetworkTokens()}>
        <TokenHookTestComponent hook={useSwappableTokens} />
      </Provider>
    )

    expect(getByTestId('tokenIDs').props.children).toEqual([mockCeloTokenId])
  })

  it('returns tokens with balance for multiple networks', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showSwap: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
    })
    const { getByTestId } = render(
      <Provider store={storeWithMultipleNetworkTokens()}>
        <TokenHookTestComponent hook={useSwappableTokens} />
      </Provider>
    )

    expect(getByTestId('tokenIDs').props.children).toEqual([ethTokenId, mockCeloTokenId])
  })
})

describe('useCashInTokens', () => {
  it('returns tokens eligible for cash in', () => {
    const { getByTestId } = render(
      <Provider store={storeWithMultipleNetworkTokens()}>
        <TokenHookTestComponent hook={useCashInTokens} />
      </Provider>
    )

    expect(getByTestId('tokenIDs').props.children).toEqual([
      mockCeurTokenId,
      mockCusdTokenId,
      mockCeloTokenId,
      mockCrealTokenId,
    ])
  })

  it('returns tokens eligible for cash in for multiple networks', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showCico: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
    })
    const { getByTestId } = render(
      <Provider store={storeWithMultipleNetworkTokens()}>
        <TokenHookTestComponent hook={useCashInTokens} />
      </Provider>
    )

    expect(getByTestId('tokenIDs').props.children).toEqual([
      mockCeurTokenId,
      mockCusdTokenId,
      mockCeloTokenId,
      mockCrealTokenId,
      ethTokenId,
    ])
  })
})

describe('useCashOutTokens', () => {
  it('returns tokens for eligible for cash out', () => {
    const { getByTestId } = render(
      <Provider store={storeWithMultipleNetworkTokens()}>
        <TokenHookTestComponent hook={useCashOutTokens} />
      </Provider>
    )

    expect(getByTestId('tokenIDs').props.children).toEqual([mockCeloTokenId])
  })

  it('returns tokens eligible for cash out for multiple networks', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showCico: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
    })
    const { getByTestId } = render(
      <Provider store={storeWithMultipleNetworkTokens()}>
        <TokenHookTestComponent hook={useCashOutTokens} />
      </Provider>
    )

    expect(getByTestId('tokenIDs').props.children).toEqual([mockCeloTokenId, ethTokenId])
  })
})
