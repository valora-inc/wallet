import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { DeviceEventEmitter } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SendEvents, TokenBottomSheetEvents } from 'src/analytics/Events'
import { APPROX_SYMBOL } from 'src/components/TokenEnterAmount'
import EnterAmount, { SendProceed } from 'src/send/EnterAmount'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import { createMockStore } from 'test/utils'
import {
  mockCeloTokenBalance,
  mockCeloTokenId,
  mockCeurTokenId,
  mockCrealTokenId,
  mockCusdTokenId,
  mockEthTokenBalance,
  mockEthTokenId,
  mockPoofAddress,
  mockPoofTokenId,
  mockTestTokenTokenId,
  mockTokenBalances,
  mockUSDCTokenId,
} from 'test/values'

jest.mock('react-native-localize')

const mockPrepareTransactionsResultPossible: PreparedTransactionsPossible = {
  type: 'possible',
  transactions: [
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt('5'.concat('0'.repeat(15))), // 0.005 CELO
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
      _baseFeePerGas: BigInt(1),
    },
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt('1'.concat('0'.repeat(15))), // 0.001 CELO
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
      _baseFeePerGas: BigInt(1),
    },
  ],
  feeCurrency: mockCeloTokenBalance,
}

const getMockStoreTokenBalances = (): Record<string, StoredTokenBalance> => ({
  ...mockTokenBalances,
  [mockCeloTokenId]: {
    ...mockTokenBalances[mockCeloTokenId],
    priceUsd: '0.5',
    balance: '10',
  },
  [mockEthTokenId]: {
    ...mockTokenBalances[mockEthTokenId],
    tokenId: mockEthTokenId,
    balance: '10',
    networkId: NetworkId['ethereum-sepolia'],
    showZeroBalance: true,
    isNative: true,
    symbol: 'ETH',
    priceFetchedAt: Date.now(),
    name: 'Ether',
  },
  [mockTestTokenTokenId]: {
    // token with no price
    balance: '10',
    tokenId: mockTestTokenTokenId,
    networkId: NetworkId['celo-alfajores'],
    showZeroBalance: false,
    isNative: false,
    symbol: 'TST',
    name: 'Test Token',
    decimals: 18,
    address: '0xtest',
  },
})
const mockStoreTokenBalances = getMockStoreTokenBalances()
const mockStore = {
  tokens: {
    tokenBalances: mockStoreTokenBalances,
  },
}

const mockStoreBalancesToTokenBalances = (storeBalances: StoredTokenBalance[]): TokenBalance[] => {
  return storeBalances.map(
    (token): TokenBalance => ({
      ...token,
      balance: new BigNumber(token.balance ?? 0),
      priceUsd: token.priceUsd ? new BigNumber(token.priceUsd) : null,
      lastKnownPriceUsd: token.priceUsd ? new BigNumber(token.priceUsd) : null,
    })
  )
}
const mockFeeCurrencies = mockStoreBalancesToTokenBalances([
  // matches mockStore
  mockStoreTokenBalances[mockCeloTokenId],
  mockStoreTokenBalances[mockCeurTokenId],
  mockStoreTokenBalances[mockCusdTokenId],
  mockStoreTokenBalances[mockCrealTokenId],
])
const onClearPreparedTransactionsSpy = jest.fn()
const onRefreshPreparedTransactionsSpy = jest.fn()
const onPressProceedSpy = jest.fn()
const defaultTokens = mockStoreBalancesToTokenBalances([
  mockStoreTokenBalances[mockPoofTokenId],
  mockStoreTokenBalances[mockCeloTokenId],
  mockStoreTokenBalances[mockEthTokenId],
  mockStoreTokenBalances[mockCusdTokenId],
])
const defaultParams = {
  tokens: defaultTokens,
  prepareTransactionsResult: undefined,
  onClearPreparedTransactions: onClearPreparedTransactionsSpy,
  onRefreshPreparedTransactions: onRefreshPreparedTransactionsSpy,
  prepareTransactionError: undefined,
  prepareTransactionsLoading: false,
  onPressProceed: onPressProceedSpy,
  ProceedComponent: SendProceed,
}

describe('EnterAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getNumberFormatSettings)
      .mockReturnValue({ decimalSeparator: '.', groupingSeparator: ',' })
    BigNumber.config({
      FORMAT: {
        decimalSeparator: '.',
        groupSeparator: ',',
        groupSize: 3,
      },
    })
  })

  it('renders the correct components, and pre-selects the first token in the list', async () => {
    const store = createMockStore(mockStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    // simulate that the keyboard is opened, since autoFocus is enabled for the token text input
    await act(() => {
      DeviceEventEmitter.emit('keyboardDidShow', { endCoordinates: { height: 100 } })
    })

    expect(getByTestId('SendEnterAmount/TokenAmountInput')).toBeTruthy()
    expect(queryByTestId('SendEnterAmount/SwitchTokens')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/AmountOptions')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    expect(queryByTestId('SendEnterAmount/FeeLabel')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()

    // simulate that the keyboard is dismissed
    await act(() => {
      DeviceEventEmitter.emit('keyboardDidHide', { endCoordinates: { height: 0 } })
    })

    await waitFor(() => expect(queryByTestId('SendEnterAmount/AmountOptions')).toBeFalsy())
  })

  it('renders components with picker if a default token is provided', async () => {
    const store = createMockStore({ ...mockStore, send: { lastUsedTokenId: mockEthTokenId } })

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} defaultToken={mockEthTokenBalance} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenAmountInput')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('ETH')
    expect(getByText('ETH on Ethereum Sepolia')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  describe.each([
    { decimal: '.', group: ',' },
    { decimal: ',', group: '.' },
  ])('with decimal separator "$decimal" and group separator "$group"', ({ decimal, group }) => {
    const replaceSeparators = (value: string) =>
      value.replace(/\./g, '|').replace(/,/g, group).replace(/\|/g, decimal)

    function renderComponent() {
      const store = createMockStore(mockStore)

      const { getByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} />
        </Provider>
      )

      const amount = getByTestId('SendEnterAmount/TokenAmountInput')
      const exchangedAmount = getByTestId('SendEnterAmount/ExchangeAmount')

      const changeAmount = (value: string) => {
        fireEvent.changeText(
          getByTestId('SendEnterAmount/TokenAmountInput'),
          replaceSeparators(value)
        )
      }

      const switchTokens = () => fireEvent.press(getByTestId('SendEnterAmount/SwitchTokens'))

      return { getByTestId, amount, exchangedAmount, changeAmount, switchTokens }
    }

    beforeEach(() => {
      jest
        .mocked(getNumberFormatSettings)
        .mockReturnValue({ decimalSeparator: decimal, groupingSeparator: group })
      BigNumber.config({
        FORMAT: {
          decimalSeparator: decimal,
          groupSeparator: group,
          groupSize: 3,
        },
      })
    })

    it('entering one amount updates the other amount', () => {
      const { amount, exchangedAmount, changeAmount, switchTokens } = renderComponent()

      changeAmount('10000.5')
      expect(amount.props.value).toBe(replaceSeparators('10,000.5'))
      expect(exchangedAmount).toHaveTextContent(replaceSeparators(`${APPROX_SYMBOL} ₱1,330.07`))

      // switch to fiat
      switchTokens()
      changeAmount('1000.5')
      expect(amount.props.value).toBe(replaceSeparators(`₱1,000.5`))
      expect(exchangedAmount).toHaveTextContent(
        replaceSeparators(`${APPROX_SYMBOL} 7,522.556391 POOF`)
      )
    })

    it('only allows numeric input with decimal separators for token amount', () => {
      const { amount, changeAmount } = renderComponent()

      changeAmount('10.5')
      expect(amount.props.value).toBe(replaceSeparators('10.5'))
      changeAmount('10.5.1')
      expect(amount.props.value).toBe(replaceSeparators('10.5'))
      changeAmount('abc')
      expect(amount.props.value).toBe(replaceSeparators('10.5'))
      changeAmount('1,5')
      // expect(amount.props.value).toBe(replaceSeparators('10.5'))
    })

    it('starting with decimal separator prefixes 0 for token amount', () => {
      const { amount, changeAmount } = renderComponent()

      changeAmount('.25')
      expect(amount.props.value).toBe(replaceSeparators('0.25'))
    })

    it('adds group separators and currency symbol for local amount', () => {
      const { amount, changeAmount, switchTokens } = renderComponent()

      // switch to fiat
      switchTokens()
      changeAmount('100000000')
      expect(amount.props.value).toBe(replaceSeparators(`₱100,000,000`))
    })

    it('only allows numeric input with 2 decimals for local amount', () => {
      const { amount, changeAmount, switchTokens } = renderComponent()

      // switch to fiat
      switchTokens()
      changeAmount('10.25')
      expect(amount.props.value).toBe(replaceSeparators(`₱10.25`))
      changeAmount('10.258')
      expect(amount.props.value).toBe(replaceSeparators(`₱10.25`))
      changeAmount('10.5.1')
      expect(amount.props.value).toBe(replaceSeparators(`₱10.25`))
      changeAmount('abc')
      expect(amount.props.value).toBe(replaceSeparators(`₱10.25`))
      changeAmount('15,')
      expect(amount.props.value).toBe(replaceSeparators(`₱15`))
    })

    it('starting with decimal separator prefixes 0 for local amount', () => {
      const { amount, changeAmount, switchTokens } = renderComponent()

      // switch to fiat
      switchTokens()
      changeAmount('.25')
      expect(amount.props.value).toBe(replaceSeparators(`₱0.25`))
    })

    it('entering invalid local amount with a valid token amount does not update anything', () => {
      const { amount, exchangedAmount, switchTokens, changeAmount } = renderComponent()

      changeAmount('10.5')
      expect(amount.props.value).toBe(replaceSeparators('10.5'))
      expect(exchangedAmount).toHaveTextContent(replaceSeparators(`${APPROX_SYMBOL} ₱1.40`))

      // switch to fiat
      switchTokens()
      changeAmount('abc')
      expect(amount.props.value).toBe(replaceSeparators('₱1.40'))
      expect(exchangedAmount).toHaveTextContent(
        replaceSeparators(`${APPROX_SYMBOL} 10.526316 POOF`)
      )
    })

    it('entering invalid token amount with a valid local amount does not update anything', () => {
      const { amount, exchangedAmount, switchTokens, changeAmount } = renderComponent()

      // switch to fiat
      switchTokens()
      changeAmount('133')
      expect(amount.props.value).toBe(replaceSeparators('₱133'))
      expect(exchangedAmount).toHaveTextContent(replaceSeparators(`${APPROX_SYMBOL} 1,000 POOF`))

      // switch to token
      switchTokens()
      expect(amount.props.value).toBe(replaceSeparators('1,000'))
      expect(exchangedAmount).toHaveTextContent(replaceSeparators(`${APPROX_SYMBOL} ₱133.00`))
    })

    it('selecting max token amount applies correct decimal separator', async () => {
      const store = createMockStore(mockStore)
      const tokenBalances = mockStoreBalancesToTokenBalances([
        { ...mockStoreTokenBalances[mockCeloTokenId], balance: '100000.42' },
      ])
      const { getByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} tokens={tokenBalances} />
        </Provider>
      )

      await act(() => {
        DeviceEventEmitter.emit('keyboardDidShow', { endCoordinates: { height: 100 } })
      })

      fireEvent.press(within(getByTestId('SendEnterAmount/AmountOptions')).getByText('maxSymbol'))
      expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe(
        replaceSeparators('100,000.42')
      )
      expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
        replaceSeparators('₱66,500.28')
      )
    })
  })

  it.each([
    { testPrefix: 'clearing one amount', text: '', expectedTokenValue: '', expectedLocalValue: '' },
    { testPrefix: 'entering 0', text: '0', expectedTokenValue: '0', expectedLocalValue: '₱0' },
  ])('$testPrefix clears the other amount', ({ text, expectedTokenValue, expectedLocalValue }) => {
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '2')
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe('2')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} ₱0.27`
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), text)
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe(expectedTokenValue)
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} ₱0.00`
    )

    // switch to fiat
    fireEvent.press(getByTestId('SendEnterAmount/SwitchTokens'))
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1.33')
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe('₱1.33')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} 10 POOF`
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), text)
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe(expectedLocalValue)
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(`${APPROX_SYMBOL} 0.00`)
  })

  it('selecting new token updates token and network info', async () => {
    const store = createMockStore(mockStore)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    expect(getByText('POOF on Celo Alfajores')).toBeTruthy()
    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    await waitFor(() => expect(getByText('Ether')).toBeTruthy())
    fireEvent.press(getByText('Ether'))
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('ETH')
    expect(getByText('ETH on Ethereum Sepolia')).toBeTruthy()
    expect(AppAnalytics.track).toHaveBeenCalledTimes(2)
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.token_dropdown_opened, {
      currentNetworkId: NetworkId['celo-alfajores'],
      currentTokenAddress: mockPoofAddress,
      currentTokenId: mockPoofTokenId,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.token_selected, {
      networkId: NetworkId['ethereum-sepolia'],
      tokenAddress: null,
      tokenId: mockEthTokenId,
      origin: 'Send',
      usedSearchTerm: false,
      tokenPositionInList: 2,
      selectedFilters: [],
    })
  })

  it('selecting new token with token amount entered updates local amount', async () => {
    const store = createMockStore(mockStore)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe('1')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} ₱0.13`
    )

    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    await waitFor(() => expect(getByText('Ether')).toBeTruthy())

    fireEvent.press(getByText('Ether'))
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('ETH')
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe('1')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} ₱1,995.00`
    )
  })

  it('selecting new token with local amount entered updates token amount', async () => {
    const store = createMockStore(mockStore)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')

    fireEvent.press(getByTestId('SendEnterAmount/SwitchTokens'))
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe('₱1')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} 7.518797 POOF`
    )

    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    await waitFor(() => expect(getByText('Ether')).toBeTruthy())

    fireEvent.press(getByText('Ether'))
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('ETH')
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe('₱1')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} 0.000501 ETH`
    )
  })

  it('using token with no price disables local amount input', async () => {
    const store = createMockStore(mockStore)

    const tokenBalances = mockStoreBalancesToTokenBalances([
      mockStoreTokenBalances[mockTestTokenTokenId],
      mockStoreTokenBalances[mockEthTokenId],
    ])

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount
          {...defaultParams}
          tokenSelectionDisabled
          tokens={tokenBalances}
          defaultToken={{ ...tokenBalances[0], priceUsd: null }}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('TST')
    expect(getByText('tokenEnterAmount.fiatPriceUnavailable')).toBeTruthy()

    // changing token amount should still show fiat price unavailable
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
    expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe('1')
    expect(getByText('tokenEnterAmount.fiatPriceUnavailable')).toBeTruthy()

    // changing to another token with price should enable local amount input
    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    await waitFor(() => expect(getByText('Ether')).toBeTruthy())
    fireEvent.press(getByText('Ether'))
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} ₱0.00`
    )

    // changing back to token with no price should disable local amount input
    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    await waitFor(() => expect(getByText('Test Token')).toBeTruthy())
    fireEvent.press(getByText('Test Token'))
    expect(getByText('tokenEnterAmount.fiatPriceUnavailable')).toBeTruthy()
  })

  it('entering local amount includes correct decimals for token amount', async () => {
    const store = createMockStore(mockStore)

    const tokenBalances = mockStoreBalancesToTokenBalances([
      mockStoreTokenBalances[mockUSDCTokenId],
      mockStoreTokenBalances[mockEthTokenId],
    ])

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} tokens={tokenBalances} />
      </Provider>
    )

    // should include 6 decimals for USDC
    fireEvent.press(getByTestId('SendEnterAmount/SwitchTokens'))
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} 0.75188 USDC`
    )

    // should truncate trailing zeroes and decimal separator when there are no decimals
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1.33')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} 1 USDC`
    )

    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    await waitFor(() => expect(getByText('Ether')).toBeTruthy())
    fireEvent.press(getByText('Ether'))

    // should include 18 decimals for ETH
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '10000')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} 5.012531 ETH`
    )

    // should truncate trailing zeroes with decimal separator
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '199.5')
    expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(
      `${APPROX_SYMBOL} 0.1 ETH`
    )
  })

  it.each([
    {
      amountLabel: 'percentage, {"percentage":25}',
      percentage: 25,
      expectedTokenAmount: '1.25',
      expectedLocalAmount: '₱0.17',
    },
    {
      amountLabel: 'percentage, {"percentage":50}',
      percentage: 50,
      expectedTokenAmount: '2.5',
      expectedLocalAmount: '₱0.33',
    },
    {
      amountLabel: 'percentage, {"percentage":75}',
      percentage: 75,
      expectedTokenAmount: '3.75',
      expectedLocalAmount: '₱0.50',
    },
    {
      amountLabel: 'maxSymbol',
      percentage: 100,
      expectedTokenAmount: '5',
      expectedLocalAmount: '₱0.67',
    },
  ])(
    'pressing the $amountLabel chip prefills the expected amount',
    async ({ amountLabel, percentage, expectedLocalAmount, expectedTokenAmount }) => {
      const store = createMockStore(mockStore)

      const { getByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} />
        </Provider>
      )

      await act(() => {
        DeviceEventEmitter.emit('keyboardDidShow', { endCoordinates: { height: 100 } })
      })

      fireEvent.press(within(getByTestId('SendEnterAmount/AmountOptions')).getByText(amountLabel))
      expect(getByTestId('SendEnterAmount/TokenAmountInput').props.value).toBe(expectedTokenAmount)
      expect(getByTestId('SendEnterAmount/ExchangeAmount')).toHaveTextContent(expectedLocalAmount)
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_percentage_selected, {
        networkId: NetworkId['celo-alfajores'],
        tokenAddress: mockPoofAddress,
        tokenId: mockPoofTokenId,
        percentage,
        flow: 'send',
      })
    }
  )

  it('entering token amount above balance displays error message', () => {
    const store = createMockStore(mockStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    // token balance 5
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '7')
    expect(getByTestId('SendEnterAmount/NotEnoughBalanceWarning')).toBeTruthy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it.each(['7', '5', '3'])(
    'disableBalanceChecks allows any %i amount above 0 to proceed',
    (amount) => {
      const store = createMockStore(mockStore)

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <EnterAmount
            {...defaultParams}
            disableBalanceCheck={true}
            prepareTransactionsResult={mockPrepareTransactionsResultPossible}
          />
        </Provider>
      )

      // token balance 5
      fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), amount)
      expect(queryByTestId('SendEnterAmount/NotEnoughBalanceWarning')).toBeFalsy()
      expect(getByTestId('SendEnterAmount/ReviewButton')).toBeEnabled()
    }
  )

  it('disableBalanceChecks does not allow 0 to proceed', () => {
    const store = createMockStore(mockStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <EnterAmount
          {...defaultParams}
          disableBalanceCheck={true}
          prepareTransactionsResult={mockPrepareTransactionsResultPossible}
        />
      </Provider>
    )

    // token balance 5
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '0')
    expect(queryByTestId('SendEnterAmount/NotEnoughBalanceWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('entering local amount above balance displays error message', () => {
    const store = createMockStore(mockStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    // token balance 5 => local balance 0.67
    fireEvent.press(getByTestId('SendEnterAmount/SwitchTokens'))
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '.68')
    expect(queryByTestId('SendEnterAmount/NotEnoughBalanceWarning')).toBeTruthy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('shows warning when prepareTransactionResult type is not-enough-balance-for-gas', () => {
    const store = createMockStore(mockStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <EnterAmount
          {...defaultParams}
          prepareTransactionsResult={{
            type: 'not-enough-balance-for-gas',
            feeCurrencies: mockFeeCurrencies,
          }}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '2')
    expect(queryByTestId('SendEnterAmount/NotEnoughBalanceWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('shows warning when prepareTransactionsResult type is need-decrease-spend-amount-for-gas', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={createMockStore(mockStore)}>
        <EnterAmount
          {...defaultParams}
          tokens={mockStoreBalancesToTokenBalances([
            mockStoreTokenBalances[mockCeloTokenId],
            mockStoreTokenBalances[mockPoofTokenId],
            mockStoreTokenBalances[mockEthTokenId],
            mockStoreTokenBalances[mockCusdTokenId],
          ])}
          prepareTransactionsResult={{
            type: 'need-decrease-spend-amount-for-gas',
            feeCurrency: mockCeloTokenBalance,
            maxGasFeeInDecimal: new BigNumber(1),
            estimatedGasFeeInDecimal: new BigNumber(1),
            decreasedSpendAmount: new BigNumber(9),
          }}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('CELO')
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '9.9999')
    expect(queryByTestId('SendEnterAmount/NotEnoughBalanceWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/MaxAmountWarning')).toBeTruthy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
    expect(getByTestId('SendEnterAmount/FeeInCrypto')).toBeTruthy()
  })

  it('able to press Review when prepareTransactionsResult is type possible (input in token)', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={createMockStore(mockStore)}>
        <EnterAmount
          {...defaultParams}
          tokens={mockStoreBalancesToTokenBalances([
            mockStoreTokenBalances[mockCeloTokenId],
            mockStoreTokenBalances[mockPoofTokenId],
            mockStoreTokenBalances[mockEthTokenId],
            mockStoreTokenBalances[mockCusdTokenId],
          ])}
          prepareTransactionsResult={mockPrepareTransactionsResultPossible}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('CELO')
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '8')
    expect(queryByTestId('SendEnterAmount/NotEnoughBalanceWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeEnabled()
    expect(queryByTestId('SendEnterAmount/FeePlaceholder')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/FeeInCrypto')).toHaveTextContent(
      `${APPROX_SYMBOL} 0.006 CELO(₱0.004)`
    )
    fireEvent.press(getByTestId('SendEnterAmount/ReviewButton'))
    expect(onPressProceedSpy).toHaveBeenCalledTimes(1)
    expect(onPressProceedSpy).toHaveBeenLastCalledWith({
      amountEnteredIn: 'token',
      localAmount: new BigNumber(5.32),
      tokenAmount: new BigNumber(8),
      token: mockStoreBalancesToTokenBalances([mockStoreTokenBalances[mockCeloTokenId]])[0],
    })
  })

  it('able to press Review when prepareTransactionsResult is type possible (input in local)', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={createMockStore(mockStore)}>
        <EnterAmount
          {...defaultParams}
          tokens={mockStoreBalancesToTokenBalances([
            mockStoreTokenBalances[mockCeloTokenId],
            mockStoreTokenBalances[mockPoofTokenId],
            mockStoreTokenBalances[mockEthTokenId],
            mockStoreTokenBalances[mockCusdTokenId],
          ])}
          prepareTransactionsResult={mockPrepareTransactionsResultPossible}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('CELO')
    fireEvent.press(getByTestId('SendEnterAmount/SwitchTokens'))
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '5')
    expect(queryByTestId('SendEnterAmount/NotEnoughBalanceWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeEnabled()
    expect(queryByTestId('SendEnterAmount/FeePlaceholder')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/FeeInCrypto')).toHaveTextContent(
      `${APPROX_SYMBOL} 0.006 CELO(₱0.004)`
    )
    fireEvent.press(getByTestId('SendEnterAmount/ReviewButton'))
    expect(onPressProceedSpy).toHaveBeenCalledTimes(1)
    expect(onPressProceedSpy).toHaveBeenLastCalledWith({
      amountEnteredIn: 'local',
      localAmount: new BigNumber(5),
      tokenAmount: new BigNumber('7.518796992481203008'),
      token: mockStoreBalancesToTokenBalances([mockStoreTokenBalances[mockCeloTokenId]])[0],
    })
  })

  it('clears prepared transactions and clear input when new token is selected', async () => {
    const tokens = mockStoreBalancesToTokenBalances([
      mockStoreTokenBalances[mockCeloTokenId],
      mockStoreTokenBalances[mockPoofTokenId],
      mockStoreTokenBalances[mockEthTokenId],
      mockStoreTokenBalances[mockCusdTokenId],
    ])
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={createMockStore(mockStore)}>
        <EnterAmount {...defaultParams} tokens={tokens} />
      </Provider>
    )
    expect(queryByTestId('SendEnterAmount/Fee')).toBeFalsy()
    expect(getByText('CELO on Celo Alfajores')).toBeTruthy()

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '8')
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '9')
    jest.runAllTimers()
    expect(onRefreshPreparedTransactionsSpy).toHaveBeenCalledTimes(
      1 // not twice since timers were not run between the two amount changes (zero to 8 and 8 to 9)
    )

    expect(jest.mocked(onRefreshPreparedTransactionsSpy)).toHaveBeenCalledWith(
      new BigNumber(9),
      tokens[0],
      mockFeeCurrencies
    )
    expect(onClearPreparedTransactionsSpy).toHaveBeenCalledTimes(3) // doesnt wait for timers

    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    await waitFor(() => expect(getByText('Ether')).toBeTruthy())
    fireEvent.press(getByText('Ether'))
    jest.runAllTimers()
    expect(onRefreshPreparedTransactionsSpy).toHaveBeenCalledTimes(1)
    expect(onClearPreparedTransactionsSpy).toHaveBeenCalledTimes(4)
  })

  it('picker icon removed, cannot change token when forceTokenId set', async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={createMockStore(mockStore)}>
        <EnterAmount
          {...defaultParams}
          defaultToken={mockCeloTokenBalance}
          tokenSelectionDisabled={true}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('CELO')
    fireEvent.press(getByTestId('SendEnterAmount/TokenSelect'))
    expect(AppAnalytics.track).toHaveBeenCalledTimes(0) // Analytics event triggered if dropdown menu opens, shouldn't happen
    expect(queryByTestId('downArrowIcon')).toBeFalsy()
  })

  describe('fee section', () => {
    it('does not show fee initially', () => {
      const store = createMockStore(mockStore)

      const { queryByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} />
        </Provider>
      )

      expect(queryByTestId('SendEnterAmount/Fee')).toBeFalsy()
    })
    it('does not show fee if input greater than balance', () => {
      const store = createMockStore(mockStore)

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '100')
      expect(queryByTestId('SendEnterAmount/Fee')).toBeFalsy()
    })
    it('does not show fee if prepare transactions result is not possible', () => {
      const store = createMockStore(mockStore)

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <EnterAmount
            {...defaultParams}
            prepareTransactionsResult={{
              type: 'not-enough-balance-for-gas',
              feeCurrencies: mockFeeCurrencies,
            }}
          />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
      expect(queryByTestId('SendEnterAmount/Fee')).toBeFalsy()
    })
    it('shows fee amount if available', () => {
      const store = createMockStore(mockStore)

      const { getByTestId } = render(
        <Provider store={store}>
          <EnterAmount
            {...defaultParams}
            prepareTransactionsResult={mockPrepareTransactionsResultPossible}
          />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
      expect(getByTestId('SendEnterAmount/FeeInCrypto')).toHaveTextContent(
        `${APPROX_SYMBOL} 0.006 CELO`
      )
    })
    it('shows review button loading spinner if prepare transactions loading is true', () => {
      const store = createMockStore(mockStore)

      const { getByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} prepareTransactionsLoading={true} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '1')
      expect(getByTestId('Button/Loading')).toBeTruthy()
    })
  })
})
