import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import ClaimRewardFeedItem from 'src/transactions/feed/ClaimRewardFeedItem'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcAddress,
  mockAaveArbUsdcTokenId,
  mockArbArbTokenId,
  mockArbUsdcTokenId,
  mockClaimRewardTransaction,
} from 'test/values'

jest.mock('src/statsig')
jest
  .mocked(getFeatureGate)
  .mockImplementation((featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS)

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockArbUsdcTokenId]: {
        tokenId: mockArbUsdcTokenId,
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
      [mockAaveArbUsdcTokenId]: {
        networkId: NetworkId['arbitrum-sepolia'],
        address: mockAaveArbUsdcAddress,
        tokenId: mockAaveArbUsdcTokenId,
        symbol: 'aArbSepUSDC',
        priceUsd: '1',
        priceFetchedAt: Date.now(),
      },
    },
  },
  positions: {
    positions: [
      {
        type: 'app-token',
        networkId: NetworkId['arbitrum-sepolia'],
        address: '0x460b97bd498e1157530aeb3086301d5225b91216',
        tokenId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
        positionId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
        appId: 'aave',
        appName: 'Aave',
        symbol: 'aArbSepUSDC',
        decimals: 6,
        displayProps: {
          title: 'USDC',
          description: 'Supplied (APY: 1.92%)',
          imageUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/aave.png',
        },
        dataProps: {
          yieldRates: [
            {
              percentage: 1.9194202601763743,
              label: 'Earnings APY',
              tokenId: 'arbitrum-sepolia:0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
            },
          ],
          earningItems: [],
          depositTokenId: 'arbitrum-sepolia:0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
          withdrawTokenId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
        },
        tokens: [
          {
            tokenId: 'arbitrum-sepolia:0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
            networkId: NetworkId['arbitrum-sepolia'],
            address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
            symbol: 'USDC',
            decimals: 6,
            priceUsd: '0',
            type: 'base-token',
            balance: '0',
          },
        ],
        pricePerShare: ['1'],
        priceUsd: '0.999',
        balance: '10',
        supply: '190288.768509',
        availableShortcutIds: ['deposit', 'withdraw'],
      },
    ],
    earnPositionIds: ['arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216'],
  },
})

describe('ClaimRewardFeedItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly', () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <ClaimRewardFeedItem transaction={mockClaimRewardTransaction} />
      </Provider>
    )

    expect(getByText('transactionFeed.claimRewardTitle')).toBeTruthy()
    expect(getByText('transactionFeed.claimRewardSubtitle, {"txAppName":"Aave"}')).toBeTruthy()
    expect(
      within(getByTestId('ClaimRewardFeedItem/amount-crypto')).getByText('+1.50 ARB')
    ).toBeTruthy()
    expect(within(getByTestId('ClaimRewardFeedItem/amount-local')).getByText('₱1.97')).toBeTruthy()
  })

  it('should display when app name is not available', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ClaimRewardFeedItem transaction={{ ...mockClaimRewardTransaction, appName: undefined }} />
      </Provider>
    )

    expect(getByText('transactionFeed.claimRewardSubtitle, {"context":"noTxAppName"}')).toBeTruthy()
  })

  it('should navigate correctly on tap', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ClaimRewardFeedItem transaction={mockClaimRewardTransaction} />
      </Provider>
    )

    fireEvent.press(
      getByTestId(`ClaimRewardFeedItem/${mockClaimRewardTransaction.transactionHash}`)
    )
    expect(navigate).toHaveBeenCalledWith(Screens.TransactionDetailsScreen, {
      transaction: mockClaimRewardTransaction,
    })
  })

  it('should fire analytic event on tap', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ClaimRewardFeedItem transaction={mockClaimRewardTransaction} />
      </Provider>
    )

    fireEvent.press(
      getByTestId(`ClaimRewardFeedItem/${mockClaimRewardTransaction.transactionHash}`)
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.transaction_feed_item_select, {
      itemType: mockClaimRewardTransaction.type,
    })
  })
})
