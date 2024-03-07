import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import JumpstartSendConfirmation from 'src/jumpstart/JumpstartSendConfirmation'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCusdTokenBalance, mockCusdTokenId } from 'test/values'

describe('JumpstartSendConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the correct information', () => {
    const { getByText } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator
          component={JumpstartSendConfirmation}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
          }}
        />
      </Provider>
    )

    expect(getByText('jumpstartSendConfirmationScreen.title')).toBeTruthy()
    expect(getByText('12.35 cUSD')).toBeTruthy() // correct rounding
    expect(getByText('₱16.42')).toBeTruthy() // local amount parsedAmount (12.345) *exchangeRate (1.33)
    expect(getByText('jumpstartSendConfirmationScreen.details')).toBeTruthy()
    expect(getByText('jumpstartSendConfirmationScreen.confirmButton')).toBeEnabled()
  })

  it('should execute the correct actions on press continue', () => {
    const { getByText } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator
          component={JumpstartSendConfirmation}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
          }}
        />
      </Provider>
    )

    fireEvent.press(getByText('jumpstartSendConfirmationScreen.confirmButton'))

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_send_confirm, {
      amountInUsd: '12.35',
      localCurrency: 'PHP',
      localCurrencyExchangeRate: '1.33',
      networkId: mockCusdTokenBalance.networkId,
      tokenAmount: '12.345',
      tokenId: mockCusdTokenBalance.tokenId,
      tokenSymbol: mockCusdTokenBalance.symbol,
    })
  })
})
