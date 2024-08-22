import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnAddCryptoBottomSheet from 'src/earn/EarnAddCryptoBottomSheet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getMultichainFeatures } from 'src/statsig'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { TokenActionName } from 'src/tokens/types'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getMultichainFeatures: jest.fn(),
  getFeatureGate: jest.fn().mockReturnValue(false),
}))

const mockStoredArbitrumUsdcTokenBalance: StoredTokenBalance = {
  tokenId: 'arbitrum-sepolia:0x123',
  priceUsd: '1.16',
  address: '0x123',
  isNative: false,
  symbol: 'USDC',
  imageUrl:
    'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_CELO.png',
  name: 'USDC',
  decimals: 6,
  balance: '5',
  isFeeCurrency: true,
  canTransferWithComment: false,
  priceFetchedAt: Date.now(),
  networkId: NetworkId['arbitrum-sepolia'],
  isSwappable: true,
  isCashInEligible: true,
  isCashOutEligible: true,
}

const mockArbitrumUsdcBalance: TokenBalance = {
  ...mockStoredArbitrumUsdcTokenBalance,
  balance: new BigNumber(mockStoredArbitrumUsdcTokenBalance.balance!),
  lastKnownPriceUsd: new BigNumber(mockStoredArbitrumUsdcTokenBalance.priceUsd!),
  priceUsd: new BigNumber(mockStoredArbitrumUsdcTokenBalance.priceUsd!),
}

const store = createMockStore({
  tokens: {
    tokenBalances: {
      ['arbitrum-sepolia:0x123']: {
        ...mockStoredArbitrumUsdcTokenBalance,
        balance: `${mockStoredArbitrumUsdcTokenBalance.balance!}`,
      },
      ['arbitrum-sepolia:0x456']: {
        ...mockStoredArbitrumUsdcTokenBalance,
        address: '0x456',
        tokenId: 'arbitrum-sepolia:0x456',
        balance: `${mockStoredArbitrumUsdcTokenBalance.balance!}`,
      },
    },
  },
  app: {
    showSwapMenuInDrawerMenu: true,
  },
})

describe('EarnAddCryptoBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getMultichainFeatures).mockReturnValue({
      showCico: [NetworkId['arbitrum-sepolia']],
      showSwap: [NetworkId['arbitrum-sepolia']],
    })
  })
  it('Renders all actions', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnAddCryptoBottomSheet
          forwardedRef={{ current: null }}
          token={mockArbitrumUsdcBalance}
          tokenAmount={new BigNumber(100)}
        />
      </Provider>
    )

    expect(getByText('addFundsActions.transfer')).toBeTruthy()
    expect(getByText('addFundsActions.swap')).toBeTruthy()
    expect(getByText('addFundsActions.add')).toBeTruthy()
  })

  it('Does not render swap action when no tokens available to swap', () => {
    const mockStore = createMockStore({
      tokens: {
        tokenBalances: {
          ['arbitrum-sepolia:0x123']: {
            ...mockStoredArbitrumUsdcTokenBalance,
            balance: `${mockStoredArbitrumUsdcTokenBalance.balance!}`,
          },
        },
      },
      app: {
        showSwapMenuInDrawerMenu: true,
      },
    })
    const { getByText, queryByText } = render(
      <Provider store={mockStore}>
        <EarnAddCryptoBottomSheet
          forwardedRef={{ current: null }}
          token={mockArbitrumUsdcBalance}
          tokenAmount={new BigNumber(100)}
        />
      </Provider>
    )

    expect(getByText('addFundsActions.transfer')).toBeTruthy()
    expect(queryByText('addFundsActions.swap')).toBeFalsy()
    expect(getByText('addFundsActions.add')).toBeTruthy()
  })

  it('Does not render swap or add when network is not in dynamic config', () => {
    jest.mocked(getMultichainFeatures).mockReturnValue({
      showCico: [NetworkId['ethereum-sepolia']],
      showSwap: [NetworkId['ethereum-sepolia']],
    })
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <EarnAddCryptoBottomSheet
          forwardedRef={{ current: null }}
          token={mockArbitrumUsdcBalance}
          tokenAmount={new BigNumber(100)}
        />
      </Provider>
    )

    expect(getByText('addFundsActions.transfer')).toBeTruthy()
    expect(queryByText('addFundsActions.swap')).toBeFalsy()
    expect(queryByText('addFundsActions.add')).toBeFalsy()
  })

  it.each([
    {
      actionName: TokenActionName.Add,
      actionTitle: 'addFundsActions.add',
      navigateScreen: Screens.SelectProvider,
      navigateProps: {
        amount: { crypto: 100, fiat: 154 },
        flow: 'CashIn',
        tokenId: 'arbitrum-sepolia:0x123',
      },
    },
    {
      actionName: TokenActionName.Transfer,
      actionTitle: 'addFundsActions.transfer',
      navigateScreen: Screens.ExchangeQR,
      navigateProps: { exchanges: [], flow: 'CashIn' },
    },
    {
      actionName: TokenActionName.Swap,
      actionTitle: 'addFundsActions.swap',
      navigateScreen: Screens.SwapScreenWithBack,
      navigateProps: { toTokenId: 'arbitrum-sepolia:0x123' },
    },
  ])(
    'triggers the correct analytics and navigation for $actionName',
    async ({ actionName, actionTitle, navigateScreen, navigateProps }) => {
      const { getByText } = render(
        <Provider store={store}>
          <EarnAddCryptoBottomSheet
            forwardedRef={{ current: null }}
            token={mockArbitrumUsdcBalance}
            tokenAmount={new BigNumber(100)}
          />
        </Provider>
      )

      fireEvent.press(getByText(actionTitle))
      expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_add_crypto_action_press, {
        action: actionName,
        address: '0x123',
        balanceUsd: 5.8,
        networkId: mockArbitrumUsdcBalance.networkId,
        symbol: mockArbitrumUsdcBalance.symbol,
        tokenId: 'arbitrum-sepolia:0x123',
      })

      expect(navigate).toHaveBeenCalledWith(navigateScreen, navigateProps)
    }
  )
})
