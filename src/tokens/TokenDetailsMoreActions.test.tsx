import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import QuickActionsSwap from 'src/icons/quick-actions/Swap'
import TokenDetailsMoreActions from 'src/tokens/TokenDetailsMoreActions'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { TokenAction, TokenActionName } from 'src/tokens/types'
import { NetworkId } from 'src/transactions/types'
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
  isFeeCurrency: true,
  canTransferWithComment: true,
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

const mockActions: TokenAction[] = [
  {
    name: TokenActionName.Send,
    title: 'tokenDetails.actions.send',
    details: 'tokenDetails.actions.sendDetails',
    iconComponent: QuickActionsSend,
    onPress: jest.fn(),
    visible: true,
  },
  {
    name: TokenActionName.Swap,
    title: 'tokenDetails.actions.swap',
    details: 'tokenDetails.actions.swapDetails',
    iconComponent: QuickActionsSwap,
    onPress: jest.fn(),
    visible: true,
  },
  {
    name: TokenActionName.Add,
    title: 'tokenDetails.actions.add',
    details: 'tokenDetails.actions.addDetails',
    iconComponent: QuickActionsAdd,
    onPress: jest.fn(),
    visible: true,
  },
  {
    name: TokenActionName.Withdraw,
    title: 'tokenDetails.actions.withdraw',
    details: 'tokenDetails.actions.withdrawDetails',
    iconComponent: QuickActionsSend,
    onPress: jest.fn(),
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

  it.each(mockActions)(
    'triggers the correct analytics and navigation for $buttonText',
    async ({ name, title, onPress }) => {
      const { getByText } = render(
        <TokenDetailsMoreActions
          forwardedRef={{ current: null }}
          token={mockCeloBalance}
          actions={mockActions}
        />
      )

      fireEvent.press(getByText(title))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        AssetsEvents.tap_token_details_bottom_sheet_action,
        {
          action: name,
          address: mockCeloAddress,
          balanceUsd: 5.8,
          networkId: mockCeloBalance.networkId,
          symbol: mockCeloBalance.symbol,
          tokenId: mockCeloTokenId,
        }
      )

      expect(onPress).toHaveBeenCalled()
    }
  )
})
