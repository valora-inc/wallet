import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { TransactionDetailsEvents } from 'src/analytics/Events'
import { APPROX_SYMBOL } from 'src/components/TokenEnterAmount'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import TransactionDetailsScreen from 'src/transactions/feed/TransactionDetailsScreen'
import {
  ClaimReward,
  DepositOrWithdraw,
  EarnClaimReward,
  EarnDeposit,
  EarnSwapDeposit,
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
import networkConfig, { blockExplorerUrls } from 'src/web3/networkConfig'
import {
  RecursivePartial,
  createMockStore,
  getElementText,
  getMockStackScreenProps,
} from 'test/utils'
import {
  mockAccount,
  mockApprovalTransaction,
  mockArbUsdcTokenId,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockClaimRewardTransaction,
  mockCusdAddress,
  mockCusdTokenId,
  mockDisplayNumber2,
  mockE164Number2,
  mockEarnClaimRewardTransaction,
  mockEarnDepositTransaction,
  mockEarnSwapDeposit,
  mockEarnWithdrawTransaction,
  mockEthTokenId,
  mockTokenBalances,
  mockUSDCAddress,
} from 'test/values'

jest.mock('src/analytics/AppAnalytics')
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
    type: TokenTransactionTypeV2.Sent | TokenTransactionTypeV2.Received
    address?: string
    amount?: TokenAmount
    metadata?: TokenTransferMetadata
    fees?: Fee[]
    status?: TransactionStatus
  }): TokenTransfer {
    return {
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

  function crossChainSwapTransaction({
    status = TransactionStatus.Complete,
    inAmountValue = '0.000029587140175469',
  }: {
    status?: TransactionStatus
    inAmountValue?: string
  }): TokenExchange {
    return {
      status,
      outAmount: {
        tokenId: mockCusdTokenId,
        tokenAddress: mockCusdAddress,
        value: '0.0994',
      },
      fees: [
        {
          amount: {
            value: '0.003342598',
            tokenAddress: mockCeloAddress,
            tokenId: mockCeloTokenId,
          },
          type: 'SECURITY_FEE',
        },
        {
          amount: {
            value: '0.0006',
            tokenAddress: mockCusdAddress,
            tokenId: mockCusdTokenId,
          },
          type: 'APP_FEE',
        },
        {
          amount: {
            value: '0.382465204637023464',
            tokenAddress: mockCeloAddress,
            tokenId: mockCeloTokenId,
          },
          type: 'CROSS_CHAIN_FEE',
        },
      ],
      inAmount: {
        tokenId: mockEthTokenId,
        tokenAddress: undefined,
        value: inAmountValue,
      },
      transactionHash: '0x2ae09a1867b0d54b614bdfa43a08b0ffaaf0cd289c830418b31d50e627d67cd8',
      block: '26934691',
      networkId: NetworkId['celo-mainnet'],
      type: TokenTransactionTypeV2.CrossChainSwapTransaction,
      timestamp: 1722345417000,
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

  function claimRewardTransaction({
    status = TransactionStatus.Complete,
    ...rest
  }: Partial<ClaimReward>): ClaimReward {
    return {
      ...mockClaimRewardTransaction,
      status,
      ...rest,
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

  function swapDepositTransaction({
    status = TransactionStatus.Complete,
  }: Partial<EarnSwapDeposit>): EarnSwapDeposit {
    return {
      ...mockEarnSwapDeposit,
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
            type: FeeType.SecurityFee,
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
        amount: {
          value: 10,
          tokenAddress: mockCusdAddress,
          tokenId: mockCusdTokenId,
          localAmount: {
            currencyCode: 'EUR',
            exchangeRate: '1.08',
            value: '9.259',
          },
        },
      }),
    })

    const nameComponent = getByTestId('TransferSent/name')
    expect(getElementText(nameComponent)).toEqual(mockName)

    const numberComponent = getByTestId('TransferSent/number')
    expect(getElementText(numberComponent)).toEqual(mockDisplayNumber2)

    expect(getByTestId('TransactionDetails/FeeRowItem')).toHaveTextContent('0.01 CELO')
    expect(getByTestId('TransactionDetails/FeeRowItem')).toHaveTextContent('€0.04') // the localAmount in the fee data is used

    expect(getByText('amountSent')).toBeTruthy()
    expect(getByTestId('TransferSent/AmountSentValue')).toHaveTextContent('10.00 cUSD')
    expect(getByTestId('TransferSent/TransferTokenExchangeRate')).toHaveTextContent('€1.08') // the localAmount in the amount data is used
    expect(getByTestId('TransferSent/AmountSentValueFiat')).toHaveTextContent('€9.26')
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
    expect(getByTestId('TransactionDetails/FeeRowItem')).toHaveTextContent('0.10 cUSD')
    expect(getByTestId('TransactionDetails/FeeRowItem')).toHaveTextContent('₱0.13')
  })

  it.each([TokenTransactionTypeV2.Sent, TokenTransactionTypeV2.Received] as const)(
    'renders details action for complete %s transaction',
    (type) => {
      const { getByText } = renderScreen({
        transaction: tokenTransfer({
          type,
          status: TransactionStatus.Complete,
        }),
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
    }
  )

  it(`renders details action for complete ${TokenTransactionTypeV2.SwapTransaction} transacton`, () => {
    const { getByText } = renderScreen({
      transaction: swapTransaction({
        status: TransactionStatus.Complete,
      }),
    })

    expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
  })

  it.each([TokenTransactionTypeV2.Sent, TokenTransactionTypeV2.Received] as const)(
    'renders check status action for pending %s transaction',
    (type) => {
      const { getByText } = renderScreen({
        transaction: tokenTransfer({
          type,
          status: TransactionStatus.Pending,
        }),
      })

      expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
    }
  )

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

    it(`renders check status action for pending ${TokenTransactionTypeV2.EarnSwapDeposit} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: swapDepositTransaction({
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

    it(`renders details action for complete ${TokenTransactionTypeV2.EarnSwapDeposit} transaction`, () => {
      const { getByText, getByTestId } = renderScreen({
        storeOverrides: {
          tokens: {
            tokenBalances: {
              [mockArbUsdcTokenId]: {
                address: mockUSDCAddress,
                tokenId: mockArbUsdcTokenId,
                symbol: 'USDC',
                balance: '50',
                priceUsd: '1',
                networkId: NetworkId['arbitrum-sepolia'],
                priceFetchedAt: Date.now(),
              },
              [mockCeloTokenId]: {
                address: mockCeloAddress,
                tokenId: mockCeloTokenId,
                symbol: 'CELO',
                balance: '100',
                priceUsd: '0.5',
                networkId: NetworkId['celo-alfajores'],
                priceFetchedAt: Date.now(),
              },
            },
          },
        },
        transaction: swapDepositTransaction({
          status: TransactionStatus.Complete,
        }),
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
      expect(getByTestId('EarnSwapDeposit/Swap/From')).toHaveTextContent('50.00 CELO')
      expect(getByTestId('EarnSwapDeposit/Swap/To')).toHaveTextContent('10.00 USDC')
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

  describe('Deposit and Withdraw', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    function depositTransaction({
      status = TransactionStatus.Complete,
      ...rest
    }: Partial<DepositOrWithdraw>): DepositOrWithdraw {
      return {
        type: TokenTransactionTypeV2.Deposit,
        networkId: NetworkId['celo-alfajores'],
        timestamp: 1234567890,
        block: '123456',
        transactionHash: '0x123',
        fees: [],
        appName: 'Aave',
        inAmount: {
          value: '100',
          tokenId: mockCeloTokenId,
        },
        outAmount: {
          value: '100',
          tokenId: mockCusdTokenId,
        },
        status,
        ...rest,
      }
    }

    function withdrawTransaction({
      status = TransactionStatus.Complete,
      ...rest
    }: Partial<DepositOrWithdraw>): DepositOrWithdraw {
      return {
        ...depositTransaction({ status }),
        type: TokenTransactionTypeV2.Withdraw,
        ...rest,
      }
    }

    it(`renders check status action for pending ${TokenTransactionTypeV2.Deposit} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: depositTransaction({
          status: TransactionStatus.Pending,
        }),
      })

      expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
    })

    it(`renders check status action for pending ${TokenTransactionTypeV2.Withdraw} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: withdrawTransaction({
          status: TransactionStatus.Pending,
        }),
      })

      expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
    })

    it(`renders details action for complete ${TokenTransactionTypeV2.Deposit} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: depositTransaction({
          status: TransactionStatus.Complete,
        }),
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
    })

    it(`renders details action for complete ${TokenTransactionTypeV2.Withdraw} transaction`, () => {
      const { getByText } = renderScreen({
        transaction: withdrawTransaction({
          status: TransactionStatus.Complete,
        }),
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
    })

    it('should display app name', () => {
      const { getByText } = renderScreen({
        transaction: depositTransaction({ appName: 'Aave' }),
        storeOverrides: {
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        },
      })

      expect(
        getByText('transactionDetails.depositSubtitle, {"txAppName":"Aave","tokenSymbol":"cUSD"}')
      ).toBeTruthy()
    })

    it('should display when app name is not available', () => {
      const { getByText } = renderScreen({
        transaction: depositTransaction({ appName: undefined }),
        storeOverrides: {
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        },
      })

      expect(
        getByText(
          'transactionDetails.depositSubtitle, {"context":"noTxAppName","tokenSymbol":"cUSD"}'
        )
      ).toBeTruthy()
    })

    it('renders swap details for deposit with swap', () => {
      const transactionWithSwap = {
        ...depositTransaction({ status: TransactionStatus.Complete }),
        swap: {
          inAmount: {
            value: '50',
            tokenId: mockCeloTokenId,
          },
          outAmount: {
            value: '100',
            tokenId: mockCusdTokenId,
          },
        },
      }

      const { getByText, getByTestId } = renderScreen({
        transaction: transactionWithSwap,
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
      expect(getByTestId('DepositOrWithdraw/Swap/From')).toBeTruthy()
      expect(getByTestId('DepositOrWithdraw/Swap/To')).toBeTruthy()
    })

    it('renders network information', () => {
      const { getByText } = renderScreen({
        transaction: depositTransaction({
          status: TransactionStatus.Complete,
        }),
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
      expect(getByText(NETWORK_NAMES[NetworkId['celo-alfajores']])).toBeTruthy()
    })

    it('renders fees correctly', () => {
      const transactionWithFees = {
        ...depositTransaction({ status: TransactionStatus.Complete }),
        fees: [
          {
            type: FeeType.SecurityFee,
            amount: {
              value: '0.1',
              tokenId: mockCeloTokenId,
            },
          },
        ],
      }

      const { getByTestId } = renderScreen({
        transaction: transactionWithFees,
      })

      expect(getByTestId('TransactionDetails/FeeRowItem')).toHaveTextContent('0.10 CELO')
    })
  })

  describe('Claim Reward', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('renders check status action for pending ClaimReward transaction', () => {
      const { getByText } = renderScreen({
        transaction: claimRewardTransaction({
          status: TransactionStatus.Pending,
        }),
      })

      expect(getByText('transactionDetailsActions.checkPendingTransactionStatus')).toBeTruthy()
    })

    it('renders details action for complete ClaimReward transaction', () => {
      const { getByText } = renderScreen({
        transaction: claimRewardTransaction({
          status: TransactionStatus.Complete,
        }),
        storeOverrides: {
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        },
      })

      expect(getByText('transactionDetailsActions.showCompletedTransactionDetails')).toBeTruthy()
    })

    it('should display app name', () => {
      const { getByText } = renderScreen({
        transaction: claimRewardTransaction({ appName: 'Aave' }),
        storeOverrides: {
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        },
      })

      expect(
        getByText(
          'transactionDetails.claimRewardSubtitle, {"txAppName":"Aave","tokenSymbol":"ARB"}'
        )
      ).toBeTruthy()
    })

    it('should display when app name is not available', () => {
      const { getByText } = renderScreen({
        transaction: claimRewardTransaction({ appName: undefined }),
        storeOverrides: {
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        },
      })

      expect(
        getByText(
          'transactionDetails.claimRewardSubtitle, {"context":"noTxAppName","tokenSymbol":"ARB"}'
        )
      ).toBeTruthy()
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
    expect(getByTestId('TransactionDetails/FeeRowItem')).toHaveTextContent('0.001 ETH')
    expect(getByTestId('TransactionDetails/FeeRowItem')).toHaveTextContent('₱2.81')
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

  it(`renders the correct details for a ${TokenTransactionTypeV2.CrossChainSwapTransaction} transacton`, () => {
    const { getByText, getByTestId, getAllByTestId } = renderScreen({
      transaction: crossChainSwapTransaction({ status: TransactionStatus.Complete }),
      storeOverrides: {
        tokens: {
          tokenBalances: mockTokenBalances,
        },
      },
    })

    expect(getByText('swapScreen.title')).toBeTruthy()
    expect(getByText('transactionFeed.crossChainSwapTransactionLabel')).toBeTruthy()
    expect(getByText('transactionStatus.transactionIsCompleted')).toBeTruthy()

    expect(getByText('swapTransactionDetailPage.swapFrom')).toBeTruthy()
    expect(getByTestId('SwapContent/swapFrom')).toHaveTextContent('0.099 cUSD')
    expect(getByText('swapTransactionDetailPage.swapTo')).toBeTruthy()
    expect(getByTestId('SwapContent/swapTo')).toHaveTextContent('0.00003 ETH')
    expect(getByText('swapTransactionDetailPage.network')).toBeTruthy()
    expect(
      getByText(
        'swapTransactionDetailPage.networkValue, {"fromNetwork":"Celo Alfajores","toNetwork":"Ethereum Sepolia"}'
      )
    ).toBeTruthy()

    expect(getByText('swapTransactionDetailPage.rate')).toBeTruthy()
    expect(getByTestId('SwapContent/rate')).toHaveTextContent('1 cUSD ≈ 0.0003 ETH')

    const [networkFee, appFee, crossChainFee] = getAllByTestId('TransactionDetails/FeeRowItem')
    expect(networkFee).toHaveTextContent('transactionFeed.networkFee')
    expect(networkFee).toHaveTextContent('0.0033 CELO')
    expect(networkFee).toHaveTextContent('₱0.059')
    expect(appFee).toHaveTextContent('transactionFeed.appFee')
    expect(appFee).toHaveTextContent('0.0006 cUSD')
    expect(appFee).toHaveTextContent('₱0.0008')
    expect(crossChainFee).toHaveTextContent('transactionFeed.crossChainFee')
    expect(crossChainFee).toHaveTextContent('0.38 CELO')
    expect(crossChainFee).toHaveTextContent('₱6.74')

    fireEvent.press(getByText('viewOnAxelarScan'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${networkConfig.crossChainExplorerUrl}0x2ae09a1867b0d54b614bdfa43a08b0ffaaf0cd289c830418b31d50e627d67cd8`,
    })
  })

  it(`renders approximate numbers for a pending ${TokenTransactionTypeV2.CrossChainSwapTransaction} transacton`, () => {
    const { getByText, getByTestId, getAllByTestId, queryByText } = renderScreen({
      transaction: crossChainSwapTransaction({ status: TransactionStatus.Pending }),
      storeOverrides: {
        tokens: {
          tokenBalances: mockTokenBalances,
        },
      },
    })

    expect(getByText('transactionStatus.transactionIsPending')).toBeTruthy()
    expect(getByTestId('SwapContent/swapTo')).toHaveTextContent(`${APPROX_SYMBOL} 0.00003 ETH`)
    expect(queryByText('swapTransactionDetailPage.rate')).toBeFalsy()

    const [networkFee, appFee, crossChainFee] = getAllByTestId('TransactionDetails/FeeRowItem')
    expect(networkFee).toHaveTextContent(`${APPROX_SYMBOL} 0.0033 CELO`)
    expect(networkFee).toHaveTextContent(`${APPROX_SYMBOL} ₱0.059`)
    expect(appFee).toHaveTextContent('0.0006 cUSD') // app fee is always known
    expect(appFee).toHaveTextContent('₱0.0008')
    expect(crossChainFee).toHaveTextContent(`${APPROX_SYMBOL} 0.38 CELO`)
    expect(crossChainFee).toHaveTextContent(`${APPROX_SYMBOL} ₱6.74`)
  })

  it(`renders a fallback swap to amount for a pending ${TokenTransactionTypeV2.CrossChainSwapTransaction} transacton`, () => {
    const { getByTestId } = renderScreen({
      transaction: crossChainSwapTransaction({
        status: TransactionStatus.Pending,
        inAmountValue: '', // can happen during account restore if there is an in flight cross-chain swap
      }),
      storeOverrides: {
        tokens: {
          tokenBalances: mockTokenBalances,
        },
      },
    })

    expect(getByTestId('SwapContent/swapTo')).toHaveTextContent('--')
  })

  it(`renders the default network explorer link for failed ${TokenTransactionTypeV2.CrossChainSwapTransaction} transacton`, () => {
    const { getByText, queryByText } = renderScreen({
      transaction: crossChainSwapTransaction({
        status: TransactionStatus.Failed,
      }),
      storeOverrides: {
        tokens: {
          tokenBalances: mockTokenBalances,
        },
      },
    })

    expect(queryByText('viewOnAxelarScan')).toBeFalsy()

    fireEvent.press(getByText('viewOnCeloScan'))
    expect(navigate).toHaveBeenCalledWith(
      Screens.WebViewScreen,
      expect.objectContaining({
        uri: 'https://celoscan.io/tx/0x2ae09a1867b0d54b614bdfa43a08b0ffaaf0cd289c830418b31d50e627d67cd8',
      })
    )
  })

  it('does not render retry action for TokenTransactionTypeV2.Received transaction', () => {
    const { queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
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
    expect(AppAnalytics.track).toHaveBeenCalledWith(
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
