import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import { AmountEnteredIn } from 'src/send/types'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockCeloTokenBalance,
  mockCeloTokenId,
  mockEthTokenId,
  mockTestTokenTokenId,
  mockTokenBalances,
} from 'test/values'
import TokenEnterAmount, { APPROX_SYMBOL } from './TokenEnterAmount'

jest.mock('react-native-localize')

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
const mockStore = { tokens: { tokenBalances: mockStoreTokenBalances } }

describe('TokenEnterAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getNumberFormatSettings)
      .mockReturnValue({ decimalSeparator: '.', groupingSeparator: ',' })
  })

  const mockOnInputChange = jest.fn()
  const mockToggleAmountType = jest.fn()
  const mockOnOpenTokenPicker = jest.fn()

  const defaultProps = {
    token: {
      ...mockCeloTokenBalance,
    } satisfies TokenBalance,
    inputValue: '1',
    tokenAmount: '1',
    localAmount: '$0.1',
    amountType: 'token' as AmountEnteredIn,
    inputRef: { current: null },
    onInputChange: mockOnInputChange,
    toggleAmountType: mockToggleAmountType,
    onOpenTokenPicker: mockOnOpenTokenPicker,
    editable: true,
    testID: 'TokenEnterAmount',
  }

  it('displays the correct token information', () => {
    const store = createMockStore(mockStore)
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} />
      </Provider>
    )
    expect(getByTestId('TokenEnterAmount/TokenName')).toHaveTextContent('CELO on Celo Alfajores')
    expect(getByText('CELO on Celo Alfajores')).toBeTruthy()
    expect(getByTestId('TokenEnterAmount/SwitchTokens')).toBeTruthy()
    expect(getByTestId('TokenEnterAmount/TokenSelect')).toBeTruthy()
    expect(getByTestId('TokenEnterAmount/TokenBalance')).toHaveTextContent(
      'tokenEnterAmount.availableBalance'
    )
  })

  it('formats the input value correctly', () => {
    const store = createMockStore(mockStore)
    const { getByTestId, rerender } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} />
      </Provider>
    )
    const input = getByTestId('TokenEnterAmount/TokenAmountInput')
    const converted = getByTestId('TokenEnterAmount/ExchangeAmount')
    expect(input.props.value).toBe('1')
    expect(converted).toHaveTextContent(`${APPROX_SYMBOL} $0.1`)
    fireEvent.press(getByTestId('TokenEnterAmount/SwitchTokens'))

    // simulate call of toggleAmountType
    rerender(
      <Provider store={store}>
        <TokenEnterAmount
          {...defaultProps}
          amountType="local"
          inputValue="0.1"
          tokenAmount="1 CELO"
        />
      </Provider>
    )

    expect(input.props.value).toBe('₱0.1')
    expect(converted).toHaveTextContent(`${APPROX_SYMBOL} 1 CELO`)
  })

  it('handles input changes correctly', () => {
    const store = createMockStore(mockStore)
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} inputValue="20" />
      </Provider>
    )

    const input = getByTestId('TokenEnterAmount/TokenAmountInput')
    fireEvent.changeText(input, '15')
    expect(mockOnInputChange).toHaveBeenCalledWith('15')
  })

  it('calls toggleAmountType on swap icon press', () => {
    const store = createMockStore(mockStore)
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} toggleAmountType={mockToggleAmountType} />
      </Provider>
    )
    const toggleButton = getByTestId('TokenEnterAmount/SwitchTokens')

    fireEvent.press(toggleButton)
    expect(mockToggleAmountType).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenTokenPicker on token selection', () => {
    const store = createMockStore(mockStore)
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} onOpenTokenPicker={mockOnOpenTokenPicker} />
      </Provider>
    )
    const tokenPicker = getByTestId('TokenEnterAmount/TokenSelect')

    fireEvent.press(tokenPicker)
    expect(mockOnOpenTokenPicker).toHaveBeenCalledTimes(1)
  })

  it('shows placeholder values correctly when no input is provided', () => {
    const store = createMockStore(mockStore)
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} inputValue="" tokenAmount="" localAmount="" />
      </Provider>
    )
    expect(getByPlaceholderText('0.00')).toBeTruthy()
  })

  it('disables input when editable is false', () => {
    const store = createMockStore(mockStore)
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} editable={false} />
      </Provider>
    )
    const input = getByTestId('TokenEnterAmount/TokenAmountInput')

    expect(input).toBeDisabled()
  })

  it('shows unavailable fiat price message when priceUsd is undefined', async () => {
    const store = createMockStore(mockStore)
    const { getByText } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} token={{ ...defaultProps.token, priceUsd: null }} />
      </Provider>
    )
    expect(getByText('tokenEnterAmount.fiatPriceUnavailable')).toBeTruthy()
  })

  it('displays the correct local and token amount approximations', () => {
    const store = createMockStore(mockStore)
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} />
      </Provider>
    )
    const exchangeAmount = getByTestId('TokenEnterAmount/ExchangeAmount')
    expect(exchangeAmount).toHaveTextContent(`${APPROX_SYMBOL} $0.1`)
  })
})
