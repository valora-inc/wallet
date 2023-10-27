import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SendOrigin } from 'src/analytics/types'
import { useMaxSendAmount } from 'src/fees/hooks'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RecipientType } from 'src/recipients/recipient'
import SendEnterAmount from 'src/send/SendEnterAmount'
import { getSupportedNetworkIdsForSend } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockEthTokenId,
  mockPoofAddress,
  mockPoofTokenId,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/tokens/utils', () => ({
  ...jest.requireActual('src/tokens/utils'),
  getSupportedNetworkIdsForSend: jest.fn(),
}))

jest.mock('src/fees/hooks')

const mockStore = {
  tokens: {
    tokenBalances: {
      ...mockTokenBalances,
      [mockEthTokenId]: {
        tokenId: mockEthTokenId,
        balance: '0',
        priceUsd: '5',
        networkId: NetworkId['ethereum-sepolia'],
        showZeroBalance: true,
        isNative: true,
        symbol: 'ETH',
        priceFetchedAt: Date.now(),
        name: 'Ether',
      },
    },
  },
}

const params = {
  origin: SendOrigin.AppSendFlow,
  recipient: {
    recipientType: RecipientType.Address,
    address: '0x123',
  },
  isFromScan: false,
}

describe('SendEnterAmount', () => {
  beforeEach(() => {
    jest
      .mocked(getSupportedNetworkIdsForSend)
      .mockReturnValue([NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']])
    jest.clearAllMocks()
  })

  it('renders components with picker using token with highest balance if no override or last used token exists', () => {
    const store = createMockStore(mockStore)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/Input')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱0.00')
    expect(getByTestId('SendEnterAmount/Max')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    expect(
      getByText('sendEnterAmountScreen.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('renders components with picker using last used token', () => {
    const store = createMockStore({ ...mockStore, send: { lastUsedTokenId: mockEthTokenId } })

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/Input')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱0.00')
    expect(getByTestId('SendEnterAmount/Max')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('ETH')
    expect(
      getByText('sendEnterAmountScreen.networkFee, {"networkName":"Ethereum Sepolia"}')
    ).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('renders components with picker using token override', () => {
    const store = createMockStore({ ...mockStore, send: { lastUsedTokenId: mockEthTokenId } })

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator
          component={SendEnterAmount}
          params={{ ...params, defaultTokenIdOverride: mockCeloTokenId }}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/Input')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱0.00')
    expect(getByTestId('SendEnterAmount/Max')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('CELO')
    expect(
      getByText('sendEnterAmountScreen.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('renders components with picker using token with highest balance if default override is not supported for sends', () => {
    jest.mocked(getSupportedNetworkIdsForSend).mockReturnValue([NetworkId['celo-alfajores']])
    const store = createMockStore(mockStore)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator
          component={SendEnterAmount}
          params={{ ...params, defaultTokenIdOverride: mockEthTokenId }}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/Input')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱0.00')
    expect(getByTestId('SendEnterAmount/Max')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    expect(
      getByText('sendEnterAmountScreen.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('entering amount updates local amount', () => {
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '10')
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱1.33')
  })

  it('only allows numeric input', () => {
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '10.5')
    expect(getByTestId('SendEnterAmount/Input').props.value).toBe('10.5')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '10.5.1')
    expect(getByTestId('SendEnterAmount/Input').props.value).toBe('10.5')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), 'abc')
    expect(getByTestId('SendEnterAmount/Input').props.value).toBe('10.5')
  })

  it('selecting new token updates token and network info', async () => {
    const store = createMockStore(mockStore)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    expect(
      getByText('sendEnterAmountScreen.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    await waitFor(() => expect(getByText('Ether')).toBeTruthy())
    fireEvent.press(getByText('Ether'))
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('ETH')
    expect(
      getByText('sendEnterAmountScreen.networkFee, {"networkName":"Ethereum Sepolia"}')
    ).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.token_dropdown_opened, {
      currentNetworkId: NetworkId['celo-alfajores'],
      currentTokenAddress: mockPoofAddress,
      currentTokenId: mockPoofTokenId,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.token_selected, {
      networkId: NetworkId['ethereum-sepolia'],
      tokenAddress: undefined,
      tokenId: mockEthTokenId,
      origin: 'Send',
    })
    // TODO(ACT-955): assert fees
  })

  it('pressing max fills in max available amount', () => {
    jest.mocked(useMaxSendAmount).mockReturnValue(new BigNumber(5))
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.press(getByTestId('SendEnterAmount/Max'))
    expect(getByTestId('SendEnterAmount/Input').props.value).toBe('5')
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱0.67')
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.max_pressed, {
      networkId: NetworkId['celo-alfajores'],
      tokenAddress: mockPoofAddress,
      tokenId: mockPoofTokenId,
    })
  })

  it('entering amount above balance displays error message', () => {
    const store = createMockStore(mockStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '7')
    expect(getByTestId('SendEnterAmount/LowerAmountError')).toBeTruthy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('entering amount below balance for non fee currency with no balance for gas shows warning', () => {
    const store = createMockStore(mockStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '2')
    expect(queryByTestId('SendEnterAmount/LowerAmountError')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('entering amount below balance for non fee currency with balance for gas allows pressing Review', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          ...mockTokenBalances,
          [mockCeloTokenId]: {
            ...mockTokenBalances[mockCeloTokenId],
            balance: '0.1',
          },
          [mockPoofTokenId]: {
            ...mockTokenBalances[mockPoofTokenId],
            balance: '100',
          },
        },
      },
    })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '50')
    expect(queryByTestId('SendEnterAmount/LowerAmountError')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeEnabled()
    fireEvent.press(getByTestId('SendEnterAmount/ReviewButton'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      origin: params.origin,
      isFromScan: params.isFromScan,
      transactionData: {
        recipient: params.recipient,
        inputAmount: new BigNumber(50),
        amountIsInLocalCurrency: false,
        tokenAddress: mockPoofAddress,
        tokenAmount: new BigNumber(50),
      },
    })
  })

  it('entering amount below balance for fee currency close to max amount shows warning', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          ...mockTokenBalances,
          [mockCeloTokenId]: {
            ...mockTokenBalances[mockCeloTokenId],
            balance: '10',
          },
        },
      },
    })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('CELO')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '9.9999')
    expect(queryByTestId('SendEnterAmount/LowerAmountError')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/MaxAmountWarning')).toBeTruthy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('entering amount below balance for fee currency with enough balance for gas allows pressing Review', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          ...mockTokenBalances,
          [mockCeloTokenId]: {
            ...mockTokenBalances[mockCeloTokenId],
            balance: '10',
          },
        },
      },
    })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('CELO')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '8')
    expect(queryByTestId('SendEnterAmount/LowerAmountError')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeEnabled()
    fireEvent.press(getByTestId('SendEnterAmount/ReviewButton'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      origin: params.origin,
      isFromScan: params.isFromScan,
      transactionData: {
        recipient: params.recipient,
        inputAmount: new BigNumber(8),
        amountIsInLocalCurrency: false,
        tokenAddress: mockCeloAddress,
        tokenAmount: new BigNumber(8),
      },
    })
  })
})
