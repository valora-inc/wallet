import { act, fireEvent, render, renderHook } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'
import { TokenBalance } from 'src/tokens/slice'
import { createMockStore } from 'test/utils'
import { mockCeloTokenBalance, mockUSDCTokenId } from 'test/values'
import TokenEnterAmount, {
  APPROX_SYMBOL,
  formatNumber,
  getDisplayLocalAmount,
  getDisplayTokenAmount,
  roundFiatValue,
  unformatNumberForProcessing,
  useEnterAmount,
} from './TokenEnterAmount'

jest.mock('react-native-localize')
jest.mock('src/analytics/AppAnalytics')

const mockStore = {
  localCurrency: {
    isLoading: false,
    preferredCurrencyCode: LocalCurrencyCode['USD'],
    fetchedCurrencyCode: LocalCurrencyCode['USD'],
    usdToLocalRate: '1',
  } satisfies RootState['localCurrency'],
}

const renderHookWithProvider = (props: Parameters<typeof useEnterAmount>[0]) => {
  const store = createMockStore(mockStore)
  return renderHook(() => useEnterAmount(props), {
    wrapper: (component) => (
      <Provider store={store}>{component?.children ? component.children : component}</Provider>
    ),
  })
}
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
    inputRef: { current: null },
    onInputChange: mockOnInputChange,
    toggleAmountType: mockToggleAmountType,
    onOpenTokenPicker: mockOnOpenTokenPicker,
    editable: true,
    testID: 'TokenEnterAmount',
  }

  it('properly formats amounts with decimal separator "." and group separator ","', () => {
    jest
      .mocked(getNumberFormatSettings)
      .mockReturnValue({ decimalSeparator: '.', groupingSeparator: ',' })

    expect(unformatNumberForProcessing('')).toBe('')
    expect(unformatNumberForProcessing('0.25')).toBe('0.25')
    expect(unformatNumberForProcessing('1,234.34567')).toBe('1234.34567')

    expect(roundFiatValue(null)).toBe('')
    expect(roundFiatValue(new BigNumber('0.01'))).toBe('0.01')
    expect(roundFiatValue(new BigNumber('0.000001'))).toBe('0.000001')
    expect(roundFiatValue(new BigNumber('1234.34567'))).toBe('1234.35')

    expect(formatNumber('')).toBe('')
    expect(formatNumber('123')).toBe('123')
    expect(formatNumber('1234')).toBe('1,234')
    expect(formatNumber('1234567')).toBe('1,234,567')
    expect(formatNumber('1234567.12345')).toBe('1,234,567.12345')
    expect(formatNumber('123456789012345')).toBe('123,456,789,012,345')
    expect(formatNumber('12.34567')).toBe('12.34567')
    expect(formatNumber('-1234567.89')).toBe('-1,234,567.89')

    const { token } = defaultProps
    expect(getDisplayTokenAmount(null, token)).toBe('')
    expect(getDisplayTokenAmount(new BigNumber(0), token)).toBe('')
    expect(getDisplayTokenAmount(new BigNumber('0.0000001'), token)).toBe('<0.000001 CELO')
    expect(getDisplayTokenAmount(new BigNumber('0.0001'), token)).toBe('0.0001 CELO')
    expect(getDisplayTokenAmount(new BigNumber('12.01'), token)).toBe('12.01 CELO')
    expect(getDisplayTokenAmount(new BigNumber('12.00000001'), token)).toBe('12 CELO')
    expect(getDisplayTokenAmount(new BigNumber('123.5678915'), token)).toBe('123.567892 CELO')
    expect(getDisplayTokenAmount(new BigNumber('1234.567891234'), token)).toBe('1,234.567891 CELO')
    expect(getDisplayTokenAmount(new BigNumber('1234567.123456'), token)).toBe(
      '1,234,567.123456 CELO'
    )

    const USD = LocalCurrencySymbol['USD']
    expect(getDisplayLocalAmount(null, USD)).toBe('')
    expect(getDisplayLocalAmount(new BigNumber(0), USD)).toBe('')
    expect(getDisplayLocalAmount(new BigNumber('0.0000001'), USD)).toBe('<$0.000001')
    expect(getDisplayLocalAmount(new BigNumber('0.0001'), USD)).toBe('$0.0001')
    expect(getDisplayLocalAmount(new BigNumber('0.00789'), USD)).toBe('$0.008')
    expect(getDisplayLocalAmount(new BigNumber('12.001'), USD)).toBe('$12.00')
    expect(getDisplayLocalAmount(new BigNumber('12.01'), USD)).toBe('$12.01')
    expect(getDisplayLocalAmount(new BigNumber('123.5678'), USD)).toBe('$123.57')
    expect(getDisplayLocalAmount(new BigNumber('1234.5678'), USD)).toBe('$1,234.57')
    expect(getDisplayLocalAmount(new BigNumber('1234567.5678'), USD)).toBe('$1,234,567.57')
  })

  it('properly formats amounts with decimal separator "," and group separator "."', () => {
    jest
      .mocked(getNumberFormatSettings)
      .mockReturnValue({ decimalSeparator: ',', groupingSeparator: '.' })

    expect(unformatNumberForProcessing('')).toBe('')
    expect(unformatNumberForProcessing('0,25')).toBe('0.25')
    expect(unformatNumberForProcessing('1.234,34567')).toBe('1234.34567')

    expect(roundFiatValue(null)).toBe('')
    expect(roundFiatValue(new BigNumber('0.01'))).toBe('0.01')
    expect(roundFiatValue(new BigNumber('0.000001'))).toBe('0.000001')
    expect(roundFiatValue(new BigNumber('1234.34567'))).toBe('1234.35')

    expect(formatNumber('')).toBe('')
    expect(formatNumber('123')).toBe('123')
    expect(formatNumber('1234')).toBe('1.234')
    expect(formatNumber('1234567')).toBe('1.234.567')
    expect(formatNumber('1234567.12345')).toBe('1.234.567,12345')
    expect(formatNumber('123456789012345')).toBe('123.456.789.012.345')
    expect(formatNumber('12.34567')).toBe('12,34567')
    expect(formatNumber('-1234567.89')).toBe('-1.234.567,89')

    const { token } = defaultProps
    expect(getDisplayTokenAmount(null, token)).toBe('')
    expect(getDisplayTokenAmount(new BigNumber(0), token)).toBe('')
    expect(getDisplayTokenAmount(new BigNumber('0.0000001'), token)).toBe('<0,000001 CELO')
    expect(getDisplayTokenAmount(new BigNumber('0.0001'), token)).toBe('0,0001 CELO')
    expect(getDisplayTokenAmount(new BigNumber('12.01'), token)).toBe('12,01 CELO')
    expect(getDisplayTokenAmount(new BigNumber('12.00000001'), token)).toBe('12 CELO')
    expect(getDisplayTokenAmount(new BigNumber('123.5678915'), token)).toBe('123,567892 CELO')
    expect(getDisplayTokenAmount(new BigNumber('1234.567891234'), token)).toBe('1.234,567891 CELO')
    expect(getDisplayTokenAmount(new BigNumber('1234567.123456'), token)).toBe(
      '1.234.567,123456 CELO'
    )

    const USD = LocalCurrencySymbol['USD']
    expect(getDisplayLocalAmount(null, USD)).toBe('')
    expect(getDisplayLocalAmount(new BigNumber(0), USD)).toBe('')
    expect(getDisplayLocalAmount(new BigNumber('0.0000001'), USD)).toBe('<$0,000001')
    expect(getDisplayLocalAmount(new BigNumber('0.0001'), USD)).toBe('$0,0001')
    expect(getDisplayLocalAmount(new BigNumber('0.00789'), USD)).toBe('$0,008')
    expect(getDisplayLocalAmount(new BigNumber('12.001'), USD)).toBe('$12,00')
    expect(getDisplayLocalAmount(new BigNumber('12.01'), USD)).toBe('$12,01')
    expect(getDisplayLocalAmount(new BigNumber('123.5678'), USD)).toBe('$123,57')
    expect(getDisplayLocalAmount(new BigNumber('1234.5678'), USD)).toBe('$1.234,57')
    expect(getDisplayLocalAmount(new BigNumber('1234567.5678'), USD)).toBe('$1.234.567,57')
  })

  describe('useEnterAmount', () => {
    it('initializes with default state', () => {
      const { result } = renderHookWithProvider({
        inputRef: { current: null },
        token: { symbol: 'ETH', decimals: 18, tokenId: '1' } as TokenBalance,
      })

      expect(result.current.amount).toBe('')
      expect(result.current.amountType).toBe('token')
    })

    it('properly formats derived state when entering token amount', async () => {
      const { result } = renderHookWithProvider({
        inputRef: { current: null },
        token: {
          symbol: 'USDC',
          decimals: 6,
          tokenId: mockUSDCTokenId,
          priceUsd: new BigNumber(1.001),
          balance: new BigNumber(1500.76),
        } as TokenBalance,
      })

      await act(() => {
        result.current.handleAmountInputChange('1234.678')
      })

      expect(result.current.amount).toBe('1234.678')
      expect(result.current.processedAmounts).toStrictEqual({
        token: {
          bignum: new BigNumber('1234.678'),
          displayAmount: '1,234.678 USDC',
        },
        local: {
          bignum: new BigNumber('1235.912678'),
          displayAmount: '$1,235.91',
        },
      })
    })

    it('properly formats derived state when entering local amount', async () => {
      const { result } = renderHookWithProvider({
        inputRef: { current: null },
        token: {
          symbol: 'USDC',
          decimals: 6,
          tokenId: mockUSDCTokenId,
          priceUsd: new BigNumber(1.001),
          balance: new BigNumber(1500.76),
        } as TokenBalance,
      })

      await act(async () => result.current.handleToggleAmountType())
      await act(async () => result.current.handleAmountInputChange('1234.67'))
      await act(async () => result.current.handleAmountInputChange('1234.678'))

      expect(result.current.amount).toBe('1234.67')
      expect(result.current.processedAmounts).toStrictEqual({
        local: {
          bignum: new BigNumber('1234.67'),
          displayAmount: '$1,234.67',
        },
        token: {
          bignum: new BigNumber('1233.436563'),
          displayAmount: '1,233.436563 USDC',
        },
      })
    })

    it('handles token input change correctly', async () => {
      const { result } = renderHookWithProvider({
        inputRef: { current: null },
        token: {
          symbol: 'ETH',
          decimals: 18,
          tokenId: '1',
          priceUsd: new BigNumber(1.001),
        } as TokenBalance,
      })

      await act(() => result.current.handleAmountInputChange('1234.5678'))
      expect(result.current.amount).toBe('1234.5678')
    })

    it('toggles amount type correctly', async () => {
      const { result } = renderHookWithProvider({
        inputRef: { current: null },
        token: {
          symbol: 'ETH',
          decimals: 18,
          tokenId: '1',
          priceUsd: new BigNumber(1.001),
        } as TokenBalance,
      })

      await act(() => result.current.handleToggleAmountType())
      expect(result.current.amountType).toBe('local')
    })
  })

  describe('component', () => {
    it('displays the correct token information', () => {
      const store = createMockStore(mockStore)
      const { getByTestId } = render(
        <Provider store={store}>
          <TokenEnterAmount
            {...defaultProps}
            inputValue="1234.5678"
            tokenAmount="1,234.5678"
            localAmount="$123.57"
            amountType="token"
          />
        </Provider>
      )

      expect(getByTestId('TokenEnterAmount/TokenName')).toHaveTextContent('CELO on Celo Alfajores')
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
          <TokenEnterAmount
            {...defaultProps}
            inputValue="1234.5678"
            tokenAmount="1,234.5678"
            localAmount="$123.57"
            amountType="token"
          />
        </Provider>
      )
      const input = getByTestId('TokenEnterAmount/TokenAmountInput')
      const converted = getByTestId('TokenEnterAmount/ExchangeAmount')
      expect(input.props.value).toBe('1,234.5678')
      expect(converted.props.children).toBe(`${APPROX_SYMBOL} $123.57`)
      fireEvent.press(getByTestId('TokenEnterAmount/SwitchTokens'))

      // simulate call of toggleAmountType
      rerender(
        <Provider store={store}>
          <TokenEnterAmount
            {...defaultProps}
            amountType="local"
            inputValue="0.1"
            tokenAmount="1 CELO"
            localAmount="$0.1"
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
          <TokenEnterAmount
            {...defaultProps}
            inputValue="20"
            tokenAmount="1,234.5678"
            localAmount="$123.57"
            amountType="token"
          />
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
          <TokenEnterAmount
            {...defaultProps}
            inputValue="1234.5678"
            tokenAmount="1,234.5678"
            localAmount="$123.57"
            amountType="token"
          />
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
          <TokenEnterAmount
            {...defaultProps}
            inputValue="1234.5678"
            tokenAmount="1,234.5678"
            localAmount="$123.57"
            amountType="token"
          />
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
          <TokenEnterAmount
            {...defaultProps}
            inputValue=""
            tokenAmount=""
            localAmount=""
            amountType="token"
          />
        </Provider>
      )
      expect(getByPlaceholderText('0.00')).toBeTruthy()
    })

    it('disables input when editable is false', () => {
      const store = createMockStore(mockStore)
      const { getByTestId } = render(
        <Provider store={store}>
          <TokenEnterAmount
            {...defaultProps}
            editable={false}
            inputValue="1234.5678"
            tokenAmount="1,234.5678"
            localAmount="$123.57"
            amountType="token"
          />
        </Provider>
      )
      const input = getByTestId('TokenEnterAmount/TokenAmountInput')

      expect(input.props.editable).toBe(false)
    })

    it('shows unavailable fiat price message when priceUsd is undefined', () => {
      const store = createMockStore(mockStore)
      const { getByText } = render(
        <Provider store={store}>
          <TokenEnterAmount
            {...defaultProps}
            token={{ ...defaultProps.token, priceUsd: null }}
            inputValue="1234.5678"
            tokenAmount="1,234.5678"
            localAmount="$123.57"
            amountType="token"
          />
        </Provider>
      )
      expect(getByText('tokenEnterAmount.fiatPriceUnavailable')).toBeTruthy()
    })

    it('displays the correct local and token amount approximations', () => {
      const store = createMockStore(mockStore)
      const { getByTestId } = render(
        <Provider store={store}>
          <TokenEnterAmount
            {...defaultProps}
            inputValue="1234.5678"
            tokenAmount="1,234.5678"
            localAmount="$123.57"
            amountType="token"
          />
        </Provider>
      )
      const exchangeAmount = getByTestId('TokenEnterAmount/ExchangeAmount')
      expect(exchangeAmount.props.children).toBe(`${APPROX_SYMBOL} $123.57`)
    })
  })
})
