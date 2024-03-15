import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import JumpstartSendConfirmation from 'src/jumpstart/JumpstartSendConfirmation'
import { depositErrorDismissed, depositTransactionStarted } from 'src/jumpstart/slice'
import { navigateHome } from 'src/navigator/NavigationService'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCusdTokenBalance, mockCusdTokenId, mockTokenBalances } from 'test/values'

const serializablePreparedTransactions = getSerializablePreparedTransactions([
  {
    from: '0xa',
    to: '0xb',
    value: BigInt(0),
    data: '0x0',
    gas: BigInt(59_480),
  },
  {
    from: '0xa',
    to: '0xc',
    value: BigInt(0),
    data: '0x0',
    gas: BigInt(1_325_000),
  },
])
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
            serializablePreparedTransactions,
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
    const store = createMockStore({
      tokens: {
        tokenBalances: mockTokenBalances,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator
          component={JumpstartSendConfirmation}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
            serializablePreparedTransactions,
          }}
        />
      </Provider>
    )

    fireEvent.press(getByText('jumpstartSendConfirmationScreen.confirmButton'))

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_send_confirm, {
      amountInUsd: '12.36',
      localCurrency: 'PHP',
      localCurrencyExchangeRate: '1.33',
      networkId: mockCusdTokenBalance.networkId,
      tokenAmount: '12.345',
      tokenId: mockCusdTokenBalance.tokenId,
      tokenSymbol: mockCusdTokenBalance.symbol,
    })
    expect(store.getActions()).toEqual([
      depositTransactionStarted({
        sendAmount: '12.345',
        sendToken: mockCusdTokenBalance,
        serializablePreparedTransactions,
      }),
    ])
  })

  it('should dispatch the correct action after successful transaction', async () => {
    const store = createMockStore({
      jumpstart: {
        depositStatus: 'idle',
      },
    })
    const { rerender } = render(
      <Provider store={store}>
        <MockedNavigator
          component={JumpstartSendConfirmation}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
            serializablePreparedTransactions,
          }}
        />
      </Provider>
    )

    const updatedStoreLoading = createMockStore({
      jumpstart: {
        depositStatus: 'loading',
      },
    })
    rerender(
      <Provider store={updatedStoreLoading}>
        <MockedNavigator
          component={JumpstartSendConfirmation}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
            serializablePreparedTransactions,
          }}
        />
      </Provider>
    )
    expect(navigateHome).not.toHaveBeenCalled()

    const updatedStoreCompleted = createMockStore({
      jumpstart: {
        depositStatus: 'success',
      },
    })
    rerender(
      <Provider store={updatedStoreCompleted}>
        <MockedNavigator
          component={JumpstartSendConfirmation}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
            serializablePreparedTransactions,
          }}
        />
      </Provider>
    )
    expect(navigateHome).toHaveBeenCalled()
  })

  it('should render a dismissable error notification if the transaction is unsuccessful', async () => {
    const { rerender, queryByText, getByText } = render(
      <Provider
        store={createMockStore({
          jumpstart: {
            depositStatus: 'idle',
          },
        })}
      >
        <MockedNavigator
          component={JumpstartSendConfirmation}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
            serializablePreparedTransactions,
          }}
        />
      </Provider>
    )

    expect(queryByText('jumpstartSendConfirmationScreen.sendError.title')).toBeFalsy()

    const updatedMockStore = createMockStore({
      jumpstart: {
        depositStatus: 'error',
      },
    })
    rerender(
      <Provider store={updatedMockStore}>
        <MockedNavigator
          component={JumpstartSendConfirmation}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
            serializablePreparedTransactions,
          }}
        />
      </Provider>
    )

    expect(getByText('jumpstartSendConfirmationScreen.sendError.title')).toBeTruthy()

    fireEvent.press(getByText('jumpstartSendConfirmationScreen.sendError.ctaLabel'))

    expect(updatedMockStore.getActions()).toEqual([depositErrorDismissed()])
  })
})
