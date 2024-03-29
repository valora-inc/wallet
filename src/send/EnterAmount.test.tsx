import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import { SendEvents, TokenBottomSheetEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EnterAmount from 'src/send/EnterAmount'
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
  mockTokenBalances,
} from 'test/values'

jest.mock('src/fees/hooks')
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
      priceUsd: new BigNumber(token.priceUsd ?? 0),
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
  onPressProceed: onPressProceedSpy,
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

  it('renders the correct components, and pre-selects the first token in the list', () => {
    const store = createMockStore(mockStore)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/Input')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱0.00')
    expect(getByTestId('SendEnterAmount/Max')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('POOF')
    expect(
      getByText('sendEnterAmountScreen.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('renders components with picker if a default token is provided', () => {
    const store = createMockStore({ ...mockStore, send: { lastUsedTokenId: mockEthTokenId } })

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} defaultToken={mockEthTokenBalance} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/Input')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱0.00')
    expect(getByTestId('SendEnterAmount/Max')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('ETH')
    expect(
      getByText('sendEnterAmountScreen.networkFee, {"networkName":"Ethereum Sepolia"}')
    ).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('entering amount updates local amount', () => {
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '10000.5')
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱1,330.07')
  })

  it('entering amount with comma as decimal separator updates local amount', () => {
    jest
      .mocked(getNumberFormatSettings)
      .mockReturnValue({ decimalSeparator: ',', groupingSeparator: '.' })
    BigNumber.config({
      FORMAT: {
        decimalSeparator: ',',
        groupSeparator: '.',
        groupSize: 3,
      },
    })
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '10000,5')
    expect(getByTestId('SendEnterAmount/LocalAmount')).toHaveTextContent('₱1.330,07')
  })

  it('only allows numeric input', () => {
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '10.5')
    expect(getByTestId('SendEnterAmount/Input').props.value).toBe('10.5')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '10.5.1')
    expect(getByTestId('SendEnterAmount/Input').props.value).toBe('10.5')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), 'abc')
    expect(getByTestId('SendEnterAmount/Input').props.value).toBe('10.5')
  })

  it('starting with decimal separator prefixes 0', () => {
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '.25')
    expect(getByTestId('SendEnterAmount/Input').props.value).toBe('0.25')
  })

  it('selecting new token updates token and network info', async () => {
    const store = createMockStore(mockStore)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
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
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.token_selected, {
      networkId: NetworkId['ethereum-sepolia'],
      tokenAddress: null,
      tokenId: mockEthTokenId,
      origin: 'Send',
      usedSearchTerm: false,
      tokenPositionInList: 2,
      selectedFilters: [],
    })
  })

  it('pressing max fills in max available amount', () => {
    const store = createMockStore(mockStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <EnterAmount {...defaultParams} />
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
        <EnterAmount {...defaultParams} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '7')
    expect(getByTestId('SendEnterAmount/LowerAmountError')).toBeTruthy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
    expect(queryByTestId('SendEnterAmount/FeePlaceholder')).toBeTruthy()
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
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '2')
    expect(queryByTestId('SendEnterAmount/LowerAmountError')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeTruthy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
    expect(getByTestId('SendEnterAmount/FeePlaceholder')).toBeTruthy()
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
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '9.9999')
    expect(queryByTestId('SendEnterAmount/LowerAmountError')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/MaxAmountWarning')).toBeTruthy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
    expect(getByTestId('SendEnterAmount/FeeInCrypto')).toBeTruthy()
  })

  it('able to press Review when prepareTransactionsResult is type possible', () => {
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
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '8')
    expect(queryByTestId('SendEnterAmount/LowerAmountError')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/MaxAmountWarning')).toBeFalsy()
    expect(queryByTestId('SendEnterAmount/NotEnoughForGasWarning')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeEnabled()
    expect(queryByTestId('SendEnterAmount/FeePlaceholder')).toBeFalsy()
    expect(getByTestId('SendEnterAmount/FeeInCrypto')).toHaveTextContent('~0.006 CELO')
    fireEvent.press(getByTestId('SendEnterAmount/ReviewButton'))
    expect(onPressProceedSpy).toHaveBeenCalledTimes(1)
  })

  it('clears prepared transactions and refreshes when new token or amount is selected', async () => {
    const tokens = mockStoreBalancesToTokenBalances([
      mockStoreTokenBalances[mockCeloTokenId],
      mockStoreTokenBalances[mockPoofTokenId],
      mockStoreTokenBalances[mockEthTokenId],
      mockStoreTokenBalances[mockCusdTokenId],
    ])
    const { getByTestId, getByText } = render(
      <Provider store={createMockStore(mockStore)}>
        <EnterAmount {...defaultParams} tokens={tokens} />
      </Provider>
    )
    expect(getByTestId('SendEnterAmount/FeePlaceholder')).toHaveTextContent('~ CELO')

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '8')
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '9')
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
    expect(onRefreshPreparedTransactionsSpy).toHaveBeenCalledTimes(2)
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
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(0) // Analytics event triggered if dropdown menu opens, shouldn't happen
    expect(queryByTestId('downArrowIcon')).toBeFalsy()
  })

  describe('fee section', () => {
    it('shows fee placeholder initially', () => {
      const store = createMockStore(mockStore)

      const { getByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} />
        </Provider>
      )

      expect(getByTestId('SendEnterAmount/FeePlaceholder')).toBeTruthy()
    })
    it('shows fee placeholder if input greater than balance', () => {
      const store = createMockStore(mockStore)

      const { getByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '100')
      expect(getByTestId('SendEnterAmount/FeePlaceholder')).toBeTruthy()
    })
    it('shows fee placeholder if prepare transactions result is not possible', () => {
      const store = createMockStore(mockStore)

      const { getByTestId } = render(
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

      fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '1')
      expect(getByTestId('SendEnterAmount/FeePlaceholder')).toBeTruthy()
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

      fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '1')
      expect(getByTestId('SendEnterAmount/FeeInCrypto')).toHaveTextContent('~0.006 CELO')
    })
    it('shows fee loading if prepare transactions result is undefined', () => {
      const store = createMockStore(mockStore)

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <EnterAmount {...defaultParams} prepareTransactionsResult={undefined} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '1')
      expect(queryByTestId('SendEnterAmount/FeePlaceholder')).toBeFalsy()
      expect(getByTestId('SendEnterAmount/FeeLoading')).toBeTruthy()
    })
  })
})
