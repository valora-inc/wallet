import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import EarnFeedItem from 'src/transactions/feed/EarnFeedItem'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcAddress,
  mockArbArbTokenId,
  mockEarnClaimRewardTransaction,
  mockEarnDepositTransaction,
  mockEarnWithdrawTransaction,
} from 'test/values'

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
      [mockArbArbTokenId]: {
        tokenId: mockArbArbTokenId,
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
    transaction: mockEarnWithdrawTransaction,
    expectedTitle: 'earnFlow.transactionFeed.earnWithdrawTitle',
    expectedSubTitle: 'earnFlow.transactionFeed.earnWithdrawSubtitle, {"providerName":"Aave"}',
    expectedTotal: '+1.00 USDC',
    expectedTotalLocal: '₱1.33',
  },
  {
    type: 'EarnDeposit',
    transaction: mockEarnDepositTransaction,
    expectedTitle: 'earnFlow.transactionFeed.earnDepositTitle',
    expectedSubTitle: 'earnFlow.transactionFeed.earnDepositSubtitle, {"providerName":"Aave"}',
    expectedTotal: '-10.00 USDC',
    expectedTotalLocal: '₱13.30',
  },
  {
    type: 'EarnClaimReward',
    transaction: mockEarnClaimRewardTransaction,
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

    it('Should fire analytic event on tap', () => {
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
