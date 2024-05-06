import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnAddCrypto from 'src/earn/EarnAddCrypto'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { TokenActionName } from 'src/tokens/types'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn(() => {
    return {
      showCico: ['arbitrum-sepolia'],
      showSwap: ['arbitrum-sepolia'],
    }
  }),
  getFeatureGate: jest.fn().mockReturnValue(true),
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
    },
  },
  app: {
    showSwapMenuInDrawerMenu: true,
  },
})

describe('EarnAddCrypto', () => {
  it('Renders correct actions', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnAddCrypto
          forwardedRef={{ current: null }}
          token={mockArbitrumUsdcBalance}
          tokenAmount={new BigNumber(100)}
        />
      </Provider>
    )

    expect(getByText('earnFlow.addCrypto.actions.receive')).toBeTruthy()
    expect(getByText('earnFlow.addCrypto.actions.swap')).toBeTruthy()
    expect(getByText('earnFlow.addCrypto.actions.add')).toBeTruthy()
  })

  it.each([
    {
      actionName: TokenActionName.Add,
      actionTitle: 'earnFlow.addCrypto.actions.add',
      navigateScreen: Screens.SelectProvider,
      navigateProps: {
        amount: { crypto: 100, fiat: 154 },
        flow: 'CashIn',
        tokenId: 'arbitrum-sepolia:0x123',
      },
    },
    {
      actionName: TokenActionName.Receive,
      actionTitle: 'earnFlow.addCrypto.actions.receive',
      navigateScreen: Screens.ExchangeQR,
      navigateProps: { exchanges: [], flow: 'CashIn' },
    },
    {
      actionName: TokenActionName.Swap,
      actionTitle: 'earnFlow.addCrypto.actions.swap',
      navigateScreen: Screens.SwapScreenWithBack,
      navigateProps: { toTokenId: 'arbitrum-sepolia:0x123' },
    },
  ])(
    'triggers the correct analytics and navigation for $actionName',
    async ({ actionName, actionTitle, navigateScreen, navigateProps }) => {
      const { getByText } = render(
        <Provider store={store}>
          <EarnAddCrypto
            forwardedRef={{ current: null }}
            token={mockArbitrumUsdcBalance}
            tokenAmount={new BigNumber(100)}
          />
        </Provider>
      )

      fireEvent.press(getByText(actionTitle))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_tap_add_crypto, {
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
