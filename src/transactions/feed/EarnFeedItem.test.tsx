import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import EarnFeedItem from 'src/transactions/feed/EarnFeedItem'
import { NetworkId, TransactionStatus } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockARBTokenId, mockAaveArbUsdcAddress } from 'test/values'

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [networkConfig.arbUsdcTokenId]: {
        tokenId: networkConfig.arbUsdcTokenId,
        symbol: 'USDC',
        priceUsd: '1',
        priceFetchedAt: Date.now(),
        networkId: NetworkId['arbitrum-sepolia'],
      },
      [mockARBTokenId]: {
        tokenId: mockARBTokenId,
        symbol: 'ARB',
        priceUsd: '0.9898',
        priceFetchedAt: Date.now(),
        networkId: NetworkId['arbitrum-sepolia'],
      },
      [networkConfig.aaveArbUsdcTokenId]: {
        networkId: NetworkId['arbitrum-sepolia'],
        address: mockAaveArbUsdcAddress,
        tokenId: networkConfig.aaveArbUsdcTokenId,
        symbol: 'aArbSepUSDC',
        priceUsd: '1',
        priceFetchedAt: Date.now(),
      },
    },
  },
})

describe.each([
  {
    type: 'EarnWithdraw',
    transaction: {
      __typename: 'EarnWithdraw',
      inAmount: {
        localAmount: null,
        tokenAddress: '0xdef',
        tokenId: networkConfig.arbUsdcTokenId,
        value: '1',
      },
      outAmount: {
        localAmount: null,
        tokenAddress: mockAaveArbUsdcAddress,
        tokenId: networkConfig.aaveArbUsdcTokenId,
        value: '0.996614',
      },
      block: '211276583',
      fees: [
        {
          amount: {
            localAmount: null,
            tokenAddress: null,
            tokenId: mockARBTokenId,
            value: '0.00000229122',
          },
          type: 'SECURITY_FEE',
        },
      ],
      networkId: NetworkId['arbitrum-sepolia'],
      providerId: 'aave-v3',
      timestamp: Date.now(),
      transactionHash: '0xHASH0',
      type: 'EARN_WITHDRAW',
      status: TransactionStatus.Complete,
    },
    expectedTitle: 'earnFlow.transactionFeed.earnWithdrawTitle',
    expectedSubTitle: 'earnFlow.transactionFeed.earnWithdrawSubtitle, {"providerName":"Aave"}',
    expectedTotal: '+1.00 USDC',
    expectedTotalLocal: '₱1.33',
  },
  {
    type: 'EarnDeposit',
    transaction: {
      __typename: 'EarnDeposit',
      inAmount: {
        localAmount: null,
        tokenAddress: mockAaveArbUsdcAddress,
        tokenId: networkConfig.aaveArbUsdcTokenId,
        value: '10',
      },
      outAmount: {
        localAmount: null,
        tokenAddress: '0xdef',
        tokenId: networkConfig.arbUsdcTokenId,
        value: '10',
      },
      block: '210927567',
      fees: [
        {
          amount: {
            localAmount: null,
            tokenAddress: null,
            tokenId: mockARBTokenId,
            value: '0.00000284243',
          },
          type: 'SECURITY_FEE',
        },
      ],
      networkId: NetworkId['arbitrum-sepolia'],
      providerId: 'aave-v3',
      timestamp: Date.now(),
      transactionHash: '0xHASH1',
      type: 'EARN_DEPOSIT',
      status: TransactionStatus.Complete,
    },
    expectedTitle: 'earnFlow.transactionFeed.earnDepositTitle',
    expectedSubTitle: 'earnFlow.transactionFeed.earnDepositSubtitle, {"providerName":"Aave"}',
    expectedTotal: '-10.00 USDC',
    expectedTotalLocal: '₱13.30',
  },
  {
    type: 'EarnClaimReward',
    transaction: {
      __typename: 'EarnClaimReward',
      amount: {
        localAmount: null,
        tokenAddress: '0xhij',
        tokenId: mockARBTokenId,
        value: '1.5',
      },
      block: '211278852',
      fees: [
        {
          amount: {
            localAmount: null,
            tokenAddress: null,
            tokenId: mockARBTokenId,
            value: '0.00000146037',
          },
          type: 'SECURITY_FEE',
        },
      ],
      networkId: NetworkId['arbitrum-sepolia'],
      providerId: 'aave-v3',
      timestamp: Date.now(),
      transactionHash: '0xHASH2',
      type: 'EARN_CLAIM_REWARD',
      status: TransactionStatus.Complete,
    } as any,
    expectedTitle: 'earnFlow.transactionFeed.earnClaimTitle',
    expectedSubTitle: 'earnFlow.transactionFeed.earnClaimSubtitle, {"providerName":"Aave"}',
    expectedTotal: '+1.50 ARB',
    expectedTotalLocal: '₱1.97',
  },
])(
  `$type`,
  ({ type, transaction, expectedTitle, expectedSubTitle, expectedTotal, expectedTotalLocal }) => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('Should render correctly', () => {
      const { getByText, getByTestId } = render(
        <Provider store={store}>
          <EarnFeedItem transaction={transaction} />
        </Provider>
      )

      expect(getByText(expectedTitle)).toBeTruthy()
      expect(getByText(expectedSubTitle)).toBeTruthy()
      expect(
        within(getByTestId(`EarnFeedItem/${type}-amount-crypto`)).getByText(expectedTotal)
      ).toBeTruthy()
      expect(
        within(getByTestId(`EarnFeedItem/${type}-amount-local`)).getByText(expectedTotalLocal)
      ).toBeTruthy()
    })

    it('Should navigate correctly on tap', () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <EarnFeedItem transaction={transaction} />
        </Provider>
      )

      fireEvent.press(getByTestId(`EarnFeedItem/${transaction.transactionHash}`))
      expect(navigate).toHaveBeenCalledWith(Screens.TransactionDetailsScreen, { transaction })
    })

    it('Should fire analytic event feed item tap', () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <EarnFeedItem transaction={transaction} />
        </Provider>
      )

      fireEvent.press(getByTestId(`EarnFeedItem/${transaction.transactionHash}`))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_feed_item_select, {
        origin: type,
      })
    })
  }
)
