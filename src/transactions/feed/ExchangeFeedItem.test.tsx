import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { RootState } from 'src/redux/reducers'
import ExchangeFeedItem from 'src/transactions/feed/ExchangeFeedItem'
import {
  Fee,
  TokenAmount,
  TokenExchangeMetadata,
  TokenTransactionTypeV2,
} from 'src/transactions/types'
import { createMockStore, getElementText, RecursivePartial } from 'test/utils'
import { mockCeloAddress, mockCusdAddress } from 'test/values'

const MOCK_TX_HASH = '0x006b866d20452a24d1d90c7514422188cc7c5d873e2f1ed661ec3f810ad5331c'

describe('ExchangeFeedItem', () => {
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
        <ExchangeFeedItem
          exchange={{
            __typename: 'TokenExchangeV2',
            type: TokenTransactionTypeV2.Exchange,
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
    expectedAmount,
    expectedTokenAmount,
  }: {
    getByTestId: (testId: string) => ReactTestInstance
    expectedTitleSections: string[]
    expectedSubtitleSections: string[]
    expectedAmount: string
    expectedTokenAmount: string
  }) {
    const title = getElementText(getByTestId('ExchangeFeedItem/title'))
    for (const titleSection of expectedTitleSections) {
      expect(title).toContain(titleSection)
    }

    const subtitle = getElementText(getByTestId('ExchangeFeedItem/subtitle'))
    for (const subtitleSection of expectedSubtitleSections) {
      expect(subtitle).toContain(subtitleSection)
    }

    const amountDisplay = getByTestId('ExchangeFeedItem/amount')
    expect(getElementText(amountDisplay)).toEqual(expectedAmount)

    const tokenDisplay = getByTestId('ExchangeFeedItem/tokenAmount')
    expect(getElementText(tokenDisplay)).toEqual(expectedTokenAmount)
  }

  it('renders correctly for CELO purchases', async () => {
    const { getByTestId } = renderScreen({
      inAmount: {
        tokenAddress: mockCusdAddress,
        value: 10,
      },
      outAmount: {
        tokenAddress: mockCeloAddress,
        value: 2,
      },
    })
    expectDisplay({
      getByTestId,
      expectedTitleSections: ['feedItemBoughtCeloTitle'],
      expectedSubtitleSections: ['feedItemExchangeCeloInfo', '2.00'],
      expectedAmount: '-₱13.30',
      expectedTokenAmount: '2.00 CELO',
    })
  })

  it('renders correctly for selling CELO', async () => {
    const { getByTestId } = renderScreen({
      inAmount: {
        tokenAddress: mockCeloAddress,
        value: 2,
      },
      outAmount: {
        tokenAddress: mockCusdAddress,
        value: 10,
      },
    })
    expectDisplay({
      getByTestId,
      expectedTitleSections: ['feedItemSoldCeloTitle'],
      expectedSubtitleSections: ['feedItemExchangeCeloInfo', '2.00'],
      expectedAmount: '+₱13.30',
      expectedTokenAmount: '2.00 CELO',
    })
  })

  it('renders the localAmount correctly when set', async () => {
    const { getByTestId } = renderScreen({
      inAmount: {
        tokenAddress: mockCeloAddress,
        value: 2,
        localAmount: {
          currencyCode: 'EUR',
          exchangeRate: '2.5',
          value: '3',
        },
      },
      outAmount: {
        tokenAddress: mockCusdAddress,
        value: 10,
        localAmount: {
          currencyCode: 'EUR',
          exchangeRate: '0.3',
          value: '3',
        },
      },
    })
    expectDisplay({
      getByTestId,
      expectedTitleSections: ['feedItemSoldCeloTitle'],
      expectedSubtitleSections: ['feedItemExchangeCeloInfo', '2.00'],
      expectedAmount: '+€3.00',
      expectedTokenAmount: '2.00 CELO',
    })
  })
})
