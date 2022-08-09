import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { RootState } from 'src/redux/reducers'
import SwapFeedItem from 'src/transactions/feed/SwapFeedItem'
import {
  Fee,
  TokenAmount,
  TokenExchangeMetadata,
  TokenTransactionTypeV2,
} from 'src/transactions/types'
import { createMockStore, getElementText, RecursivePartial } from 'test/utils'
import { mockCeurAddress, mockCusdAddress } from 'test/values'

const MOCK_TX_HASH = '0x006b866d20452a24d1d90c7514422188cc7c5d873e2f1ed661ec3f810ad5331c'

describe('SwapFeedItem', () => {
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
  }) {
    const store = createMockStore({
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <SwapFeedItem
          exchange={{
            __typename: 'TokenExchangeV2',
            type: TokenTransactionTypeV2.SwapTransaction,
            transactionHash: MOCK_TX_HASH,
            timestamp: 1234,
            block: '2345',
            inAmount,
            outAmount,
            metadata,
            fees,
          }}
        />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  function expectDisplay({
    getByTestId,
    expectedTitleSections,
    expectedSubtitleSections,
    expectedIncomingAmount,
    expectedOutgoingAmount,
  }: {
    getByTestId: (testId: string) => ReactTestInstance
    expectedTitleSections: string
    expectedSubtitleSections: string
    expectedIncomingAmount: string
    expectedOutgoingAmount: string
  }) {
    const title = getElementText(getByTestId('SwapFeedItem/title'))
    expect(getElementText(title)).toEqual(expectedTitleSections)

    const subtitle = getElementText(getByTestId('SwapFeedItem/subtitle'))
    expect(getElementText(subtitle)).toEqual(expectedSubtitleSections)

    const amountDisplay = getByTestId('SwapFeedItem/incomingAmount')
    expect(getElementText(amountDisplay)).toEqual(expectedIncomingAmount)

    const tokenDisplay = getByTestId('SwapFeedItem/outgoingAmount')
    expect(getElementText(tokenDisplay)).toEqual(expectedOutgoingAmount)
  }

  it('renders correctly for cUSD to cEUR swap', async () => {
    const { getByTestId } = renderScreen({
      inAmount: {
        tokenAddress: mockCeurAddress,
        value: 2.93,
      },
      outAmount: {
        tokenAddress: mockCusdAddress,
        value: 2.87,
      },
    })
    expectDisplay({
      getByTestId,
      expectedTitleSections: 'swapScreen.title',
      expectedSubtitleSections: 'cUSD to cEUR',
      expectedIncomingAmount: '+2.93 cEUR',
      expectedOutgoingAmount: '-2.87 cUSD',
    })
  })

  it('renders correctly for cEUR to cUSD swap', async () => {
    const { getByTestId } = renderScreen({
      inAmount: {
        tokenAddress: mockCusdAddress,
        value: 17.87,
      },
      outAmount: {
        tokenAddress: mockCeurAddress,
        value: 17.54,
      },
    })
    expectDisplay({
      getByTestId,
      expectedTitleSections: 'swapScreen.title',
      expectedSubtitleSections: 'cEUR to cUSD',
      expectedIncomingAmount: '+17.87 cUSD',
      expectedOutgoingAmount: '-17.54 cEUR',
    })
  })
})
