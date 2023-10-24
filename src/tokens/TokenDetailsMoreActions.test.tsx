import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOFlow } from 'src/fiatExchanges/utils'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import QuickActionsSwap from 'src/icons/quick-actions/Swap'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { onPressCicoAction } from 'src/tokens/TokenDetails'
import TokenDetailsMoreActions from 'src/tokens/TokenDetailsMoreActions'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { TokenDetailsAction, TokenDetailsActionName } from 'src/tokens/types'
import { Network, NetworkId } from 'src/transactions/types'
import { mockCeloAddress, mockCeloTokenId } from 'test/values'

const mockStoredCeloTokenBalance: StoredTokenBalance = {
  tokenId: mockCeloTokenId,
  priceUsd: '1.16',
  address: mockCeloAddress,
  isNative: true,
  symbol: 'CELO',
  imageUrl:
    'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_CELO.png',
  name: 'Celo',
  decimals: 18,
  balance: '5',
  isCoreToken: true,
  priceFetchedAt: Date.now(),
  networkId: NetworkId['celo-alfajores'],
  isSwappable: true,
  isCashInEligible: true,
  isCashOutEligible: true,
}

const mockCeloBalance: TokenBalance = {
  ...mockStoredCeloTokenBalance,
  balance: new BigNumber(mockStoredCeloTokenBalance.balance!),
  lastKnownPriceUsd: new BigNumber(mockStoredCeloTokenBalance.priceUsd!),
  priceUsd: new BigNumber(mockStoredCeloTokenBalance.priceUsd!),
}

const mockActions: TokenDetailsAction[] = [
  {
    name: TokenDetailsActionName.Send,
    title: 'tokenDetails.actions.send',
    details: 'tokenDetails.actions.sendDetails',
    iconComponent: QuickActionsSend,
    onPress: () => {
      navigate(Screens.Send, { defaultTokenIdOverride: mockCeloTokenId })
    },
    visible: true,
  },
  {
    name: TokenDetailsActionName.Swap,
    title: 'tokenDetails.actions.swap',
    details: 'tokenDetails.actions.swapDetails',
    iconComponent: QuickActionsSwap,
    onPress: () => {
      navigate(Screens.SwapScreenWithBack, { fromTokenId: mockCeloTokenId })
    },
    visible: true,
  },
  {
    name: TokenDetailsActionName.Add,
    title: 'tokenDetails.actions.add',
    details: 'tokenDetails.actions.addDetails',
    iconComponent: QuickActionsAdd,
    onPress: () => {
      onPressCicoAction(mockCeloBalance, CICOFlow.CashIn)
    },
    visible: true,
  },
  {
    name: TokenDetailsActionName.Withdraw,
    title: 'tokenDetails.actions.withdraw',
    details: 'tokenDetails.actions.withdrawDetails',
    iconComponent: QuickActionsSend,
    onPress: () => {
      onPressCicoAction(mockCeloBalance, CICOFlow.CashOut)
    },
    visible: true,
  },
]

describe('TokenDetailsMoreActions', () => {
  it('Renders correct actions', () => {
    const { getByText } = render(
      <TokenDetailsMoreActions
        forwardedRef={{ current: null }}
        token={mockCeloBalance}
        actions={mockActions}
      />
    )

    expect(getByText('tokenDetails.actions.send')).toBeTruthy()
    expect(getByText('tokenDetails.actions.swap')).toBeTruthy()
    expect(getByText('tokenDetails.actions.add')).toBeTruthy()
    expect(getByText('tokenDetails.actions.withdraw')).toBeTruthy()
  })

  const mockAddParams = {
    currency: mockCeloBalance.symbol,
    tokenId: mockCeloTokenId,
    flow: CICOFlow.CashIn,
    network: Network.Celo,
  }

  const mockWithdrawParams = {
    currency: mockCeloBalance.symbol,
    tokenId: mockCeloTokenId,
    flow: CICOFlow.CashOut,
    network: Network.Celo,
  }

  it.each`
    action                             | buttonText                         | navigatedScreen               | navigationParams
    ${TokenDetailsActionName.Send}     | ${'tokenDetails.actions.send'}     | ${Screens.Send}               | ${{ defaultTokenIdOverride: mockCeloTokenId }}
    ${TokenDetailsActionName.Swap}     | ${'tokenDetails.actions.swap'}     | ${Screens.SwapScreenWithBack} | ${{ fromTokenId: mockCeloTokenId }}
    ${TokenDetailsActionName.Add}      | ${'tokenDetails.actions.add'}      | ${Screens.FiatExchangeAmount} | ${mockAddParams}
    ${TokenDetailsActionName.Withdraw} | ${'tokenDetails.actions.withdraw'} | ${Screens.FiatExchangeAmount} | ${mockWithdrawParams}
  `(
    'triggers the correct analytics and navigation for $buttonText',
    async ({ action, buttonText, navigatedScreen, navigationParams }) => {
      const { getByText } = render(
        <TokenDetailsMoreActions
          forwardedRef={{ current: null }}
          token={mockCeloBalance}
          actions={mockActions}
        />
      )

      fireEvent.press(getByText(buttonText))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        AssetsEvents.tap_token_details_bottom_sheet_action,
        {
          action,
          address: mockCeloAddress,
          balanceUsd: 5.8,
          networkId: mockCeloBalance.networkId,
          symbol: mockCeloBalance.symbol,
          tokenId: mockCeloTokenId,
        }
      )

      expect(navigate).toHaveBeenCalledWith(navigatedScreen, navigationParams)
    }
  )
})
