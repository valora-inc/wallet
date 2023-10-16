import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import TokenDetailsMoreActions from 'src/tokens/TokenDetailsMoreActions'
import { TokenDetailsActionName } from 'src/tokens/types'
import { Network } from 'src/transactions/types'
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
        <Provider store={store}>
          <MockedNavigator
            component={TokenDetailsMoreActions}
            params={{ tokenId: mockCeloTokenId }}
          />
        </Provider>
      )

      fireEvent.press(getByText(buttonText))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        AssetsEvents.tap_token_details_bottom_sheet_action,
        {
          action,
          address: mockCeloAddress,
          balanceUsd: 1325.0855831552522,
          networkId: mockCeloBalance.networkId,
          symbol: mockCeloBalance.symbol,
          tokenId: mockCeloTokenId,
        }
      )

      expect(navigate).toHaveBeenCalledWith(navigatedScreen, navigationParams)
    }
  )
})
