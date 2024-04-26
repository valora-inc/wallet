import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import {
  Fee,
  NetworkId,
  TokenAmount,
  TokenExchangeMetadata,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { RecursivePartial, createMockStore, getElementText } from 'test/utils'
import { mockCeurTokenId, mockCusdTokenId } from 'test/values'

const MOCK_TX_HASH = '0x006b866d20452a24d1d90c7514422188cc7c5d873e2f1ed661ec3f810ad5331c'

jest.mock('src/statsig')

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereuim-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

describe('SwapFeedItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })
  function renderScreen({
    storeOverrides = {},
    inAmount,
    outAmount,
    metadata = {},
    fees = [],
  }: {
    inAmount: TokenAmount
    outAmount: TokenAmount
    metadata?: TokenExchangeMetadata
    fees?: Fee[]
    storeOverrides?: RecursivePartial<RootState>
    hideBalance?: boolean
  }) {
    const store = createMockStore({
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <SwapFeedItem
          exchange={{
            __typename: 'TokenExchangeV3',
            networkId: NetworkId['celo-alfajores'],
            type: TokenTransactionTypeV2.SwapTransaction,
            transactionHash: MOCK_TX_HASH,
            timestamp: 1234,
            block: '2345',
            inAmount,
            outAmount,
            metadata,
            fees,
            status: TransactionStatus.Complete,
          }}
        />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  it('renders correctly for cUSD to cEUR swap', async () => {
    const { getByTestId } = renderScreen({
      inAmount: {
        tokenId: mockCeurTokenId,
        value: 2.93,
      },
      outAmount: {
        tokenId: mockCusdTokenId,
        value: 2.87,
      },
    })

    expect(getElementText(getByTestId('SwapFeedItem/title'))).toEqual('swapScreen.title')
    expect(getElementText(getByTestId('SwapFeedItem/subtitle'))).toEqual(
      'feedItemSwapPath, {"token1":"cUSD","token2":"cEUR"}'
    )
    expect(getElementText(getByTestId('SwapFeedItem/incomingAmount'))).toEqual('+2.93 cEUR')
    expect(getElementText(getByTestId('SwapFeedItem/outgoingAmount'))).toEqual('-2.87 cUSD')
  })

  it('renders correctly for cEUR to cUSD swap', async () => {
    const { getByTestId } = renderScreen({
      inAmount: {
        tokenId: mockCusdTokenId,
        value: 17.87,
      },
      outAmount: {
        tokenId: mockCeurTokenId,
        value: 17.54,
      },
    })

    expect(getElementText(getByTestId('SwapFeedItem/title'))).toEqual('swapScreen.title')
    expect(getElementText(getByTestId('SwapFeedItem/subtitle'))).toEqual(
      'feedItemSwapPath, {"token1":"cEUR","token2":"cUSD"}'
    )
    expect(getElementText(getByTestId('SwapFeedItem/incomingAmount'))).toEqual('+17.87 cUSD')
    expect(getElementText(getByTestId('SwapFeedItem/outgoingAmount'))).toEqual('-17.54 cEUR')
  })
})
