import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import TokenDetailsMoreActions from 'src/tokens/TokenDetailsMoreActions'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCeloAddress, mockCeloTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn(() => {
    return {
      showCico: ['celo-alfajores'],
      showSend: ['celo-alfajores'],
      showSwap: ['celo-alfajores'],
      showBalances: ['celo-alfajores'],
    }
  }),
}))

const mockCeloBalance = mockTokenBalances[mockCeloTokenId]
mockCeloBalance.balance = '100'
mockCeloBalance.isSwappable = true

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockCeloTokenId]: mockCeloBalance,
    },
  },
  app: {
    // TODO(tomm): check with Satish that we only want to display if swap is in the drawer menu
    showSwapMenuInDrawerMenu: true,
  },
})

describe('TokenDetailsMoreActions', () => {
  it('Renders correct actions', () => {
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator
          component={TokenDetailsMoreActions}
          params={{ tokenId: mockCeloTokenId }}
        />
      </Provider>
    )

    expect(getByText('tokenDetails.actions.send')).toBeTruthy()
    expect(getByText('tokenDetails.actions.swap')).toBeTruthy()
    expect(getByText('tokenDetails.actions.add')).toBeTruthy()
    expect(getByText('tokenDetails.actions.withdraw')).toBeTruthy()
  })

  it('Triggers correct action on send press', () => {
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator
          component={TokenDetailsMoreActions}
          params={{ tokenId: mockCeloTokenId }}
        />
      </Provider>
    )

    fireEvent.press(getByText('tokenDetails.actions.send'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AssetsEvents.tap_token_details_bottom_sheet_action,
      {
        action: 'Send',
        address: mockCeloAddress,
        balanceUsd: 1325.0855831552522,
        networkId: mockCeloBalance.networkId,
        symbol: mockCeloBalance.symbol,
        tokenId: mockCeloTokenId,
      }
    )

    expect(navigate).toHaveBeenCalledWith(Screens.Send, { defaultTokenIdOverride: mockCeloTokenId })
  })
})
