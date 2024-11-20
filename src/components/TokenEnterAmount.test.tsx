import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
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
import TokenEnterAmount, {
  APPROX_SYMBOL,
  groupNumber,
  roundLocalAmount,
  roundTokenAmount,
} from './TokenEnterAmount'

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
    testID: 'tokenEnterAmount',
  }

  describe('groupNumber', () => {
    it('properly groups numbers', () => {
      expect(groupNumber('')).toBe('')
      expect(groupNumber('123')).toBe('123')
      expect(groupNumber('1234')).toBe('1group234')
      expect(groupNumber('1234567')).toBe('1group234group567')
      expect(groupNumber('1234567.12345')).toBe('1group234group567.12345')
      expect(groupNumber('123456789012345')).toBe('123group456group789group012group345')
      expect(groupNumber('12.34567')).toBe('12.34567')
      expect(groupNumber('-1234567.89')).toBe('-1group234group567.89')
      expect(groupNumber('1234abc')).toBe('1group234abc')
      expect(groupNumber('1234.56xyz')).toBe('1group234.56xyz')
    })
  })

  describe.each([
    { decimal: '.', group: ',' },
    { decimal: ',', group: '.' },
  ])('with decimal separator "$decimal" and group separator "$group"', ({ decimal, group }) => {
    it('properly rounds token amounts', () => {
      expect(roundTokenAmount('', defaultProps.token)).toBe('')
      expect(roundTokenAmount('0.0000001', defaultProps.token)).toBe('<0.000001 CELO')
      expect(roundTokenAmount('1234.567891234', defaultProps.token)).toBe('1,234.567891 CELO')
      expect(roundTokenAmount('1234567.123456', defaultProps.token)).toBe(
        '1group234group567.123456 CELO'
      )
    })

    it('proprly rounds local amount', () => {
      expect(roundLocalAmount('', LocalCurrencySymbol['USD'])).toBe('')
      expect(roundLocalAmount('0.0000001', LocalCurrencySymbol['USD'])).toBe('<$0.000001')
      expect(roundLocalAmount('1234.5678', LocalCurrencySymbol['USD'])).toBe('$1group234.57')
      expect(roundLocalAmount('0.00789', LocalCurrencySymbol['USD'])).toBe('$0.0079')
    })
  })

  describe('roundTokenAmount', () => {})

  describe('roundLocalAmount', () => {})

  it('renders without crashing', () => {
    const store = createMockStore(mockStore)
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} />
      </Provider>
    )
    expect(getByTestId('tokenEnterAmount')).toBeTruthy()
  })

  it('displays the correct token information', () => {
    const store = createMockStore(mockStore)
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} />
      </Provider>
    )
    expect(getByTestId('tokenEnterAmount/TokenName')).toBeTruthy()
    expect(getByText('CELO on Celo Alfajores')).toBeTruthy()
    expect(getByTestId('tokenEnterAmount/SwitchTokens')).toBeTruthy()
    expect(getByTestId('tokenEnterAmount/TokenSelect')).toBeTruthy()
    expect(getByTestId('tokenEnterAmount/TokenBalance')).toBeTruthy()
    expect(getByTestId('tokenEnterAmount/TokenBalance').props.children.props.i18nKey).toBe(
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
    const input = getByTestId('tokenEnterAmount/TokenAmountInput')
    const converted = getByTestId('tokenEnterAmount/ExchangeAmount')
    expect(input.props.value).toBe('1')
    expect(converted.props.children).toBe(`${APPROX_SYMBOL} $0.1`)
    fireEvent.press(getByTestId('tokenEnterAmount/SwitchTokens'))

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
    expect(converted.props.children).toBe(`${APPROX_SYMBOL} 1 CELO`)
  })

  it('handles input changes correctly', () => {
    const store = createMockStore(mockStore)
    const { getByTestId } = render(
      <Provider store={store}>
        <TokenEnterAmount {...defaultProps} inputValue="20" />
      </Provider>
    )

    const input = getByTestId('tokenEnterAmount/TokenAmountInput')
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
    const toggleButton = getByTestId('tokenEnterAmount/SwitchTokens')

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
    const tokenPicker = getByTestId('tokenEnterAmount/TokenSelect')

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
    const input = getByTestId('tokenEnterAmount/TokenAmountInput')

    expect(input.props.editable).toBe(false)
  })

  it('shows unavailable fiat price message when priceUsd is undefined', () => {
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
    const exchangeAmount = getByTestId('tokenEnterAmount/ExchangeAmount')
    expect(exchangeAmount.props.children).toBe(`${APPROX_SYMBOL} $0.1`)
  })
})
