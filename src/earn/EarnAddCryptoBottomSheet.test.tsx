import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnAddCryptoBottomSheet from 'src/earn/EarnAddCryptoBottomSheet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { TokenActionName } from 'src/tokens/types'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn(),
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
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showCico: ['arbitrum-sepolia'],
      showSwap: ['arbitrum-sepolia'],
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

    expect(getByText('earnFlow.addCryptoBottomSheet.actions.transfer')).toBeTruthy()
    expect(getByText('earnFlow.addCryptoBottomSheet.actions.swap')).toBeTruthy()
    expect(getByText('earnFlow.addCryptoBottomSheet.actions.add')).toBeTruthy()
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

    expect(getByText('earnFlow.addCryptoBottomSheet.actions.transfer')).toBeTruthy()
    expect(queryByText('earnFlow.addCryptoBottomSheet.actions.swap')).toBeFalsy()
    expect(getByText('earnFlow.addCryptoBottomSheet.actions.add')).toBeTruthy()
  })

  it('Does not render swap or add when network is not in dynamic config', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showCico: ['ethereum-sepolia'],
      showSwap: ['ethereum-sepolia'],
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

    expect(getByText('earnFlow.addCryptoBottomSheet.actions.transfer')).toBeTruthy()
    expect(queryByText('earnFlow.addCryptoBottomSheet.actions.swap')).toBeFalsy()
    expect(queryByText('earnFlow.addCryptoBottomSheet.actions.add')).toBeFalsy()
  })

  it.each([
    {
      actionName: TokenActionName.Add,
      actionTitle: 'earnFlow.addCryptoBottomSheet.actions.add',
      navigateScreen: Screens.SelectProvider,
      navigateProps: {
        amount: { crypto: 100, fiat: 154 },
        flow: 'CashIn',
        tokenId: 'arbitrum-sepolia:0x123',
      },
    },
    {
      actionName: TokenActionName.Transfer,
      actionTitle: 'earnFlow.addCryptoBottomSheet.actions.transfer',
      navigateScreen: Screens.ExchangeQR,
      navigateProps: { exchanges: [], flow: 'CashIn' },
    },
    {
      actionName: TokenActionName.Swap,
      actionTitle: 'earnFlow.addCryptoBottomSheet.actions.swap',
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
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_add_crypto_action_press, {
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
