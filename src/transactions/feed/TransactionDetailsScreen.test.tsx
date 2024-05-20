import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { TransactionDetailsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import TransactionDetailsScreen from 'src/transactions/feed/TransactionDetailsScreen'
import {
  EarnClaimReward,
  EarnDeposit,
  EarnWithdraw,
  Fee,
  FeeType,
  NetworkId,
  TokenAmount,
  TokenApproval,
  TokenExchange,
  TokenExchangeMetadata,
  TokenTransaction,
  TokenTransactionTypeV2,
  TokenTransfer,
  TokenTransferMetadata,
  TransactionStatus,
} from 'src/transactions/types'
import { blockExplorerUrls } from 'src/web3/networkConfig'
import {
  RecursivePartial,
  createMockStore,
  getElementText,
  getMockStackScreenProps,
} from 'test/utils'
import {
  mockAccount,
  mockApprovalTransaction,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockDisplayNumber2,
  mockE164Number2,
  mockEarnClaimRewardTransaction,
  mockEarnDepositTransaction,
  mockEarnWithdrawTransaction,
} from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')

const mockAddress = '0x8C3b8Af721384BB3479915C72CEe32053DeFca4E'
const mockName = 'Hello World'

describe('TransactionDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderScreen({
    storeOverrides = {},
    transaction,
  }: {
    storeOverrides?: RecursivePartial<RootState>
    transaction: TokenTransaction
  }) {
    const store = createMockStore({
      identity: { addressToE164Number: { [mockAddress]: mockE164Number2 } },
      recipients: { phoneRecipientCache: { [mockE164Number2]: { name: mockName } } },
      ...storeOverrides,
    })

    const mockScreenProps = getMockStackScreenProps(Screens.TransactionDetailsScreen, {
      transaction,
    })

    const tree = render(
      <Provider store={store}>
        <TransactionDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  function tokenTransfer({
    type,
    address = mockAccount,
    amount = {
      value: 10,
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
      localAmount: {
        currencyCode: 'EUR',
        exchangeRate: '0.4',
        value: '4',
      },
    },
    metadata = {},
    fees = [],
    status = TransactionStatus.Complete,
  }: {
    type: TokenTransactionTypeV2
    address?: string
    amount?: TokenAmount
    metadata?: TokenTransferMetadata
    fees?: Fee[]
    status?: TransactionStatus
  }): TokenTransfer {
    return {
      __typename: 'TokenTransferV3',
      networkId: NetworkId['celo-alfajores'],
      type,
      transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
      timestamp: 1542306118,
      block: '8648978',
      address,
      amount,
      metadata,
      fees,
      status,
    }
  }

  function swapTransaction({
    inAmount = {
      value: 34,
      tokenAddress: mockCeurAddress,
      tokenId: mockCeurTokenId,
    },
    outAmount = {
      value: 17,
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
    },
    metadata = {},
    fees = [
      {
        type: FeeType.SecurityFee,
        amount: {
          value: 0.1,
          tokenAddress: mockCusdAddress,
          tokenId: mockCusdTokenId,
        },
      },
    ],
    status = TransactionStatus.Complete,
    networkId = NetworkId['celo-alfajores'],
  }: {
    inAmount?: TokenAmount
    outAmount?: TokenAmount
    metadata?: TokenExchangeMetadata
    fees?: Fee[]
    status?: TransactionStatus
    networkId?: NetworkId
  }): TokenExchange {
    return {
      __typename: 'TokenExchangeV3',
      networkId,
      type: TokenTransactionTypeV2.SwapTransaction,
      transactionHash: '0xf5J440sML02q2z8q92Vyt3psStjBACc3825KmFGB2Zk1zMil6wrI306097C1Rps2',
      timestamp: 1531306119,
      block: '7523159',
      inAmount,
      outAmount,
      metadata,
      fees,
      status,
    }
  }

  function approvalTransaction({
    status = TransactionStatus.Complete,
  }: Partial<TokenApproval>): TokenApproval {
    return {
      ...mockApprovalTransaction,
      status,
    }
  }

  function earnClaimTransaction({
    status = TransactionStatus.Complete,
  }: Partial<EarnClaimReward>): EarnClaimReward {
    return {
      ...mockEarnClaimRewardTransaction,
      status,
    }
  }

  function earnDepositTransaction({
    status = TransactionStatus.Complete,
  }: Partial<EarnDeposit>): EarnDeposit {
    return {
      ...mockEarnDepositTransaction,
      status,
    }
  }

  function earnWithdrawTransaction({
    status = TransactionStatus.Complete,
  }: Partial<EarnWithdraw>): EarnWithdraw {
    return {
      ...mockEarnWithdrawTransaction,
      status,
    }
  }

  it('renders correctly for sends', async () => {
    const { getByTestId, getByText } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
        address: mockAddress,
        fees: [
          {
            type: 'fee_type',
            amount: {
              value: '0.01',
              tokenAddress: mockCeloAddress,
              tokenId: mockCeloTokenId,
              localAmount: {
                value: '0.04',
                currencyCode: 'EUR',
                exchangeRate: '0.4',
              },
            },
          },
        ],
      }),
    })

    const nameComponent = getByTestId('TransferSent/name')
    expect(getElementText(nameComponent)).toEqual(mockName)

    const numberComponent = getByTestId('TransferSent/number')
    expect(getElementText(numberComponent)).toEqual(mockDisplayNumber2)

    expect(getByTestId('TransactionDetails/NetworkFee')).toHaveTextContent('0.01 CELO')
    expect(getByTestId('TransactionDetails/NetworkFeeLocalCurrency')).toHaveTextContent('₱0.067')

    expect(getByText('amountSent')).toBeTruthy()
    expect(getByTestId('TransferSent/AmountSentValue')).toHaveTextContent('10.00 cUSD')
    expect(getByTestId('TransferSent/TransferTokenExchangeRate')).toHaveTextContent('₱1.33')
    expect(getByTestId('TransferSent/AmountSentValueFiat')).toHaveTextContent('₱13.30')
  })

  it('renders correctly for receives', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
        address: mockAddress,
      }),
    })

    const nameComponent = getByTestId('TransferReceived/name')
    expect(getElementText(nameComponent)).toEqual(mockName)

    const numberComponent = getByTestId('TransferReceived/number')
    expect(getElementText(numberComponent)).toEqual(mockDisplayNumber2)

    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('€4.00')
  })

  it('renders correctly for rewards received', async () => {
    const { getByTestId, queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
        address: mockAddress,
      }),
      storeOverrides: {
        identity: {},
        recipients: { rewardsSenders: [mockAddress] },
      },
    })

    const nameComponent = getByTestId('RewardReceived/name')
    expect(getElementText(nameComponent)).toEqual('feedItemRewardReceivedTitle')

    expect(queryByTestId('RewardReceived/number')).toBeNull()

    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('€4.00')
  })

  it('renders correctly for cUSD to cEUR swap', async () => {
    const { getByTestId } = renderScreen({
      transaction: swapTransaction({}),
      storeOverrides: {},
    })

    const swapTo = getByTestId('SwapContent/swapTo')
    expect(getElementText(swapTo)).toEqual('34.00 cEUR')

    const swapFrom = getByTestId('SwapContent/swapFrom')
    expect(getElementText(swapFrom)).toEqual('17.00 cUSD')

    const rate = getByTestId('SwapContent/rate')
    expect(getElementText(rate)).toEqual('1 cUSD ≈ 2.00 cEUR')

    // Includes the fee
    const estimatedFee = getByTestId('TransactionDetails/NetworkFee')
    expect(getElementText(estimatedFee)).toEqual('0.10 cUSD')

    const estimatedFeeInLocalCurrency = getByTestId('TransactionDetails/NetworkFeeLocalCurrency')
    expect(getElementText(estimatedFeeInLocalCurrency)).toEqual('₱0.13')
  })

  it.each([
    TokenTransactionTypeV2.Sent,
    TokenTransactionTypeV2.InviteSent,
    TokenTransactionTypeV2.Received,
    TokenTransactionTypeV2.InviteReceived,
  ])('renders details action for complete %s transaction', (type) => {
    const { getByText } = renderScreen({
      transaction: tokenTransfer({
        type,
        status: TransactionStatus.Complete,
      }),
    })

    expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
  })

  it(`renders details action for complete ${TokenTransactionTypeV2.SwapTransaction} transacton`, () => {
    const { getByText } = renderScreen({
      transaction: swapTransaction({
        status: TransactionStatus.Complete,
      }),
    })

    expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
  })

  it.each([
    TokenTransactionTypeV2.Sent,
    TokenTransactionTypeV2.InviteSent,
    TokenTransactionTypeV2.Received,
    TokenTransactionTypeV2.InviteReceived,
  ])('renders check status action for pending %s transaction', (type) => {
    const { getByText } = renderScreen({
      transaction: tokenTransfer({
        type,
        status: TransactionStatus.Pending,
      }),
    })

    expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
  })

  it(`renders check status action for pending ${TokenTransactionTypeV2.SwapTransaction} transacton`, () => {
    const { getByText } = renderScreen({
      transaction: swapTransaction({
        status: TransactionStatus.Pending,
      }),
    })

    expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
  })

  it(`renders check status action for pending ${TokenTransactionTypeV2.Approval} transacton`, () => {
    const { getByText } = renderScreen({
      transaction: approvalTransaction({
        status: TransactionStatus.Pending,
      }),
    })

    expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
  })

  describe('Earn', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.mocked(getDynamicConfigParams).mockImplementation(({ configName, defaultValues }) => {
        switch (configName) {
          case StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG:
            return {
              providerName: 'Aave',
              providerLogoUrl: 'logoUrl',
              providerTermsAndConditionsUrl: 'termsUrl',
            }
          default:
            return defaultValues
        }
      })
    })

    it(`renders check status action for pending ${TokenTransactionTypeV2.EarnClaimReward} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: earnClaimTransaction({
          status: TransactionStatus.Pending,
        }),
      })

      expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
    })

    it(`renders check status action for pending ${TokenTransactionTypeV2.EarnDeposit} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: earnDepositTransaction({
          status: TransactionStatus.Pending,
        }),
      })

      expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
    })

    it(`renders check status action for pending ${TokenTransactionTypeV2.EarnWithdraw} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: earnWithdrawTransaction({
          status: TransactionStatus.Pending,
        }),
      })

      expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
    })

    it(`renders details action for complete ${TokenTransactionTypeV2.EarnClaimReward} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: earnClaimTransaction({
          status: TransactionStatus.Complete,
        }),
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
    })

    it(`renders details action for complete ${TokenTransactionTypeV2.EarnDeposit} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: earnDepositTransaction({
          status: TransactionStatus.Complete,
        }),
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
    })

    it(`renders details action for complete ${TokenTransactionTypeV2.EarnWithdraw} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: earnWithdrawTransaction({
          status: TransactionStatus.Complete,
        }),
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
    })
  })

  it(`renders the correct details for ${TokenTransactionTypeV2.Approval} transaction`, () => {
    const { getByText, getByTestId } = renderScreen({
      transaction: approvalTransaction({
        status: TransactionStatus.Complete,
      }),
      storeOverrides: {
        tokens: {
          tokenBalances: {
            'ethereum-sepolia:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
              name: 'USD Coin',
              balance: '0',
              tokenId: 'ethereum-sepolia:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              networkId: NetworkId['ethereum-sepolia'],
              decimals: 6,
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
            },
            'ethereum-sepolia:native': {
              name: 'Ether',
              isNative: true,
              priceUsd: '2051.31',
              balance: '0',
              networkId: NetworkId['ethereum-sepolia'],
              tokenId: 'ethereum-sepolia:native',
              decimals: 18,
              priceFetchedAt: Date.now(),
              symbol: 'ETH',
            },
          },
        },
      },
    })

    expect(
      getByText('transactionFeed.infiniteApprovalDescription, {"tokenSymbol":"USDC"}')
    ).toBeTruthy()
    expect(getByTestId('TransactionDetails/NetworkFee')).toHaveTextContent('0.001 ETH')
    expect(getByTestId('TransactionDetails/NetworkFeeLocalCurrency')).toHaveTextContent('₱2.81')
  })

  it(`renders retry action for failed ${TokenTransactionTypeV2.Sent} transacton`, () => {
    const { getByText } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
        status: TransactionStatus.Failed,
      }),
    })

    expect(getByText('transactionDetailsActions.retryFailedTransaction')).toBeTruthy()
  })

  it(`renders retry action for failed ${TokenTransactionTypeV2.SwapTransaction} transacton`, () => {
    const { getByText } = renderScreen({
      transaction: swapTransaction({
        status: TransactionStatus.Failed,
      }),
    })

    expect(getByText('transactionDetailsActions.retryFailedTransaction')).toBeTruthy()
  })

  it.each([
    TokenTransactionTypeV2.InviteSent,
    TokenTransactionTypeV2.Received,
    TokenTransactionTypeV2.InviteReceived,
  ])('does not render retry action for %s transaction', (type) => {
    const { queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type,
        status: TransactionStatus.Failed,
      }),
    })

    expect(queryByTestId('transactionDetails/primaryAction')).toBeFalsy()
  })

  it(`navigates to the celo block explorer url on tap on details action when network is celo`, () => {
    const { getByText } = renderScreen({
      transaction: swapTransaction({
        networkId: NetworkId['celo-alfajores'],
        status: TransactionStatus.Complete,
      }),
    })

    fireEvent.press(getByText('transactionDetailsActions.showCompletedTransactionDetails'))

    expect(navigate).toHaveBeenCalledWith(
      Screens.WebViewScreen,
      expect.objectContaining({
        uri: expect.stringMatching(
          RegExp(`^${new URL(blockExplorerUrls[NetworkId['celo-alfajores']].baseTxUrl).origin}`)
        ),
      })
    )
  })

  it(`navigates to the ethereum block explorer url on tap on details action when the network is ethereum`, () => {
    const { getByText } = renderScreen({
      transaction: swapTransaction({
        networkId: NetworkId['ethereum-sepolia'],
        status: TransactionStatus.Complete,
      }),
    })

    fireEvent.press(getByText('transactionDetailsActions.showCompletedTransactionDetails'))

    expect(navigate).toHaveBeenCalledWith(
      Screens.WebViewScreen,
      expect.objectContaining({
        uri: expect.stringMatching(
          RegExp(`^${new URL(blockExplorerUrls[NetworkId['ethereum-sepolia']].baseTxUrl).origin}`)
        ),
      })
    )
  })

  it('does not render details action if the transaction networkId is unknown', () => {
    const { queryByTestId } = renderScreen({
      transaction: swapTransaction({
        // @ts-ignore: an edge case specifically for unit tests
        networkId: 'test-unknown-network',
        status: TransactionStatus.Complete,
      }),
    })

    expect(queryByTestId('transactionDetails/primaryAction')).toBeFalsy()
  })

  it(`navigates to the celo block explorer url on tap on block explorer link when network is celo`, () => {
    const { getByText } = renderScreen({
      transaction: swapTransaction({
        networkId: NetworkId['celo-alfajores'],
        status: TransactionStatus.Complete,
      }),
    })

    fireEvent.press(getByText('viewOnCeloScan'))

    expect(navigate).toHaveBeenCalledWith(
      Screens.WebViewScreen,
      expect.objectContaining({
        uri: expect.stringMatching(
          RegExp(`^${new URL(blockExplorerUrls[NetworkId['celo-alfajores']].baseTxUrl).origin}`)
        ),
      })
    )
  })

  it(`navigates to the ethereum block explorer url on tap on block explorer link when the network is ethereum`, () => {
    const { getByText } = renderScreen({
      transaction: swapTransaction({
        networkId: NetworkId['ethereum-sepolia'],
        status: TransactionStatus.Complete,
      }),
    })

    fireEvent.press(getByText('viewOnEthereumBlockExplorer'))

    expect(navigate).toHaveBeenCalledWith(
      Screens.WebViewScreen,
      expect.objectContaining({
        uri: expect.stringMatching(
          RegExp(`^${new URL(blockExplorerUrls[NetworkId['ethereum-sepolia']].baseTxUrl).origin}`)
        ),
      })
    )
  })

  it('does not render block explorer link if the transaction networkId is unknown', () => {
    const { queryByTestId } = renderScreen({
      transaction: swapTransaction({
        // @ts-ignore: an edge case specifically for unit tests
        networkId: 'test-unknown-network',
        status: TransactionStatus.Complete,
      }),
    })

    expect(queryByTestId('transactionDetails/blockExplorerLink')).toBeFalsy()
  })

  it('sends correct analytics event on tap on explorer link', () => {
    const { getByTestId } = renderScreen({
      transaction: swapTransaction({
        status: TransactionStatus.Complete,
      }),
    })

    fireEvent.press(getByTestId('transactionDetails/blockExplorerLink'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      TransactionDetailsEvents.transaction_details_tap_block_explorer,
      {
        transactionType: TokenTransactionTypeV2.SwapTransaction,
        transactionStatus: TransactionStatus.Complete,
      }
    )
  })

  it('navigates to the send select recipient screen on retry tap', async () => {
    const { getByText } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
        status: TransactionStatus.Failed,
      }),
    })

    fireEvent.press(getByText('transactionDetailsActions.retryFailedTransaction'))
    expect(navigate).toHaveBeenCalledWith(Screens.SendSelectRecipient)
  })
})
