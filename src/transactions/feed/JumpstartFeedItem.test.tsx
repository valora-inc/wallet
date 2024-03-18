import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import JumpstartFeedItem from 'src/transactions/feed/JumpstartFeedItem'
import {
  Fee,
  NetworkId,
  TokenAmount,
  TokenTransactionTypeV2,
  TokenTransferMetadata,
  TransactionStatus,
} from 'src/transactions/types'
import { RecursivePartial, createMockStore, getElementText } from 'test/utils'
import { mockCusdAddress, mockCusdTokenId } from 'test/values'

const MOCK_JUMPSTART_ADDRESS = '0x7BF3fefE9881127553D23a8Cd225a2c2442c438C'.toLowerCase()
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

describe('JumpstartFeedItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })
  function renderScreen({
    storeOverrides = {},
    type = TokenTransactionTypeV2.Sent,
    amount = {
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
      value: 10,
    },
    address = MOCK_JUMPSTART_ADDRESS,
    metadata = {},
    fees = [],
    status = TransactionStatus.Complete,
  }: {
    type?: TokenTransactionTypeV2
    amount?: TokenAmount
    address?: string
    metadata?: TokenTransferMetadata
    fees?: Fee[]
    storeOverrides?: RecursivePartial<RootState>
    status?: TransactionStatus
  }) {
    const store = createMockStore({
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <JumpstartFeedItem
          transfer={{
            __typename: 'TokenTransferV3',
            networkId: NetworkId['celo-alfajores'],
            type,
            status,
            transactionHash: MOCK_TX_HASH,
            timestamp: 1234,
            block: '2345',
            address,
            amount,
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
    queryByTestId,
    expectedTitleSections,
    expectedSubtitleSections,
    expectedAmount,
    expectedTokenAmount,
  }: {
    getByTestId: (testId: string) => ReactTestInstance
    queryByTestId?: (testId: string) => ReactTestInstance | null
    expectedTitleSections: string[]
    expectedSubtitleSections: string[]
    expectedAmount: string
    expectedTokenAmount: string | null
  }) {
    const title = getElementText(getByTestId('JumpstartFeedItem/title'))
    for (const titleSection of expectedTitleSections) {
      expect(title).toContain(titleSection)
    }

    const subtitle = getElementText(getByTestId('JumpstartFeedItem/subtitle'))
    for (const subtitleSection of expectedSubtitleSections) {
      expect(subtitle).toContain(subtitleSection)
    }

    const amountDisplay = getByTestId('JumpstartFeedItem/amount')
    expect(getElementText(amountDisplay)).toEqual(expectedAmount)

    if (expectedTokenAmount) {
      const tokenDisplay = getByTestId('JumpstartFeedItem/tokenAmount')
      expect(getElementText(tokenDisplay)).toEqual(expectedTokenAmount)
    } else {
      expect(queryByTestId!('TransferFeedItem/tokenAmount')).toBeNull()
    }
  }

  it('renders correctly for jumpstart deposit', async () => {
    const { getByTestId } = renderScreen({
      type: TokenTransactionTypeV2.Sent,
      amount: {
        tokenAddress: mockCusdAddress,
        tokenId: mockCusdTokenId,
        value: -10,
      },
    })

    expectDisplay({
      getByTestId,
      expectedTitleSections: ['feedItemJumpstartTitle'],
      expectedSubtitleSections: ['feedItemJumpstartSentSubtitle'],
      expectedAmount: '-₱13.30',
      expectedTokenAmount: '10.00 cUSD',
    })
  })

  it('renders correctly for jumpstart receive', async () => {
    const { getByTestId } = renderScreen({
      type: TokenTransactionTypeV2.Received,
    })
    expectDisplay({
      getByTestId,
      expectedTitleSections: ['feedItemJumpstartTitle'],
      expectedSubtitleSections: ['feedItemJumpstartReceivedSubtitle'],
      expectedAmount: '+₱13.30',
      expectedTokenAmount: '10.00 cUSD',
    })
  })
})
