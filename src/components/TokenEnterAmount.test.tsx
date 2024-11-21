import { act, fireEvent, render, renderHook } from '@testing-library/react-native'
import React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SendEvents } from 'src/analytics/Events'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { AmountEnteredIn } from 'src/send/types'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockCeloTokenBalance } from 'test/values'
import TokenEnterAmount, {
  APPROX_SYMBOL,
  formatNumber,
  roundLocalAmount,
  roundTokenAmount,
  useEnterAmount,
} from './TokenEnterAmount'

jest.mock('react-native-localize')
jest.mock('src/analytics/AppAnalytics')
jest.mock('src/redux/hooks', () => ({ useSelector: jest.fn() }))

const mockStore = {}

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

  describe.each([
    { decimal: '.', group: ',' },
    { decimal: ',', group: '.' },
  ])('with decimal separator "$decimal" and group separator "$group"', ({ decimal, group }) => {
    beforeEach(() => {
      jest.mocked(getNumberFormatSettings).mockReturnValue({
        decimalSeparator: decimal,
        groupingSeparator: group,
      })
    })

    const replaceSeparators = (value: string) =>
      value.replace(/\./g, '|').replace(/,/g, group).replace(/\|/g, decimal)

    it('properly groups numbers', () => {
      expect(formatNumber('')).toBe('')
      expect(formatNumber('123')).toBe(replaceSeparators('123'))
      expect(formatNumber('1234')).toBe(replaceSeparators('1,234'))
      expect(formatNumber('1234567')).toBe(replaceSeparators('1,234,567'))
      expect(formatNumber('1234567.12345')).toBe(replaceSeparators('1,234,567.12345'))
      expect(formatNumber('123456789012345')).toBe(replaceSeparators('123,456,789,012,345'))
      expect(formatNumber('12.34567')).toBe(replaceSeparators('12.34567'))
      expect(formatNumber('-1234567.89')).toBe(replaceSeparators('-1,234,567.89'))
      expect(formatNumber('1234abc')).toBe(replaceSeparators('1,234abc'))
      expect(formatNumber('1234.56xyz')).toBe(replaceSeparators('1,234.56xyz'))
    })

    it('properly rounds token amounts', () => {
      expect(roundTokenAmount('', defaultProps.token)).toBe(replaceSeparators(''))
      expect(roundTokenAmount('0.0000001', defaultProps.token)).toBe(
        replaceSeparators('<0.000001 CELO')
      )
      expect(roundTokenAmount('0.0001', defaultProps.token)).toBe(replaceSeparators('0.0001 CELO'))
      expect(roundTokenAmount('12.01', defaultProps.token)).toBe(replaceSeparators('12.01 CELO'))
      expect(roundTokenAmount('12.00000001', defaultProps.token)).toBe(replaceSeparators('12 CELO'))
      expect(roundTokenAmount('123.5678915', defaultProps.token)).toBe(
        replaceSeparators('123.567892 CELO')
      )
      expect(roundTokenAmount('1234.567891234', defaultProps.token)).toBe(
        replaceSeparators('1,234.567891 CELO')
      )
      expect(roundTokenAmount('1234567.123456', defaultProps.token)).toBe(
        replaceSeparators('1,234,567.123456 CELO')
      )
    })

    it('proprly rounds local amount', () => {
      expect(roundLocalAmount('', LocalCurrencySymbol['USD'])).toBe(replaceSeparators(''))
      expect(roundLocalAmount('0.0000001', LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('<$0.000001')
      )
      expect(roundLocalAmount('0.0001', LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$0.0001')
      )
      expect(roundLocalAmount('0.00789', LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$0.008')
      )
      expect(roundLocalAmount('12.001', LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$12.00')
      )
      expect(roundLocalAmount('12.01', LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$12.01')
      )
      expect(roundLocalAmount('123.5678', LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$123.57')
      )
      expect(roundLocalAmount('1234.5678', LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$1,234.57')
      )
      expect(roundLocalAmount('1234567.5678', LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$1,234,567.57')
      )
    })
  })

  describe('useEnterAmount', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() =>
        useEnterAmount({
          token: { symbol: 'ETH', decimals: 18, tokenId: '1' } as TokenBalance,
        })
      )

      expect(result.current.amount).toBe('')
      expect(result.current.amountType).toBe('token')
    })

    it('handles token input change correctly', async () => {
      const { result } = renderHook(() =>
        useEnterAmount({
          token: { symbol: 'ETH', decimals: 18, tokenId: '1' } as TokenBalance,
        })
      )

      await act(() => {
        result.current.handleAmountInputChange('1234.5678')
      })

      expect(result.current.amount).toBe('1234.5678')
    })

    it('toggles amount type correctly', async () => {
      const { result } = renderHook(() =>
        useEnterAmount({
          token: { symbol: 'ETH', decimals: 18, tokenId: '1' } as TokenBalance,
        })
      )

      await act(() => {
        result.current.handleToggleAmountType()
      })

      expect(result.current.amountType).toBe('local')
    })

    it('opens token picker and executes analytics track call', async () => {
      const { result } = renderHook(() =>
        useEnterAmount({
          token: {
            tokenId: '1',
            address: '0x00',
            networkId: NetworkId['celo-mainnet'],
          } as TokenBalance,
        })
      )

      await act(() => {
        result.current.onOpenTokenPicker()
      })

      expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.token_dropdown_opened, {
        currentTokenId: '1',
        currentTokenAddress: '0x00',
        currentNetworkId: NetworkId['celo-mainnet'],
      })
    })
  })

  describe('TokenEnterAmount component', () => {
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

      expect(input.props.value).toBe('$0.1')
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
})
