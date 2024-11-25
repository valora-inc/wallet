import { act, fireEvent, render, renderHook } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SendEvents } from 'src/analytics/Events'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { convertLocalToTokenAmount, convertTokenToLocalAmount } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockCeloTokenBalance, mockCusdTokenBalance, mockUSDCTokenId } from 'test/values'
import TokenEnterAmount, {
  APPROX_SYMBOL,
  formatNumber,
  getReadableLocalAmount,
  getReadableTokenAmount,
  useEnterAmount,
} from './TokenEnterAmount'

jest.mock('react-native-localize')
jest.mock('src/analytics/AppAnalytics')
jest.mock('src/redux/hooks', () => ({ useSelector: jest.fn() }))
jest.mock('src/tokens/hooks', () => ({ useTokenInfo: jest.fn() }))
jest.mock('src/tokens/utils', () => ({
  convertLocalToTokenAmount: jest.fn(),
  convertTokenToLocalAmount: jest.fn(),
}))

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
    inputRef: { current: null },
    onInputChange: mockOnInputChange,
    toggleAmountType: mockToggleAmountType,
    onOpenTokenPicker: mockOnOpenTokenPicker,
    editable: true,
    testID: 'TokenEnterAmount',
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
      expect(getReadableTokenAmount(null, defaultProps.token)).toBe(replaceSeparators(''))
      expect(getReadableTokenAmount(new BigNumber(0), defaultProps.token)).toBe(
        replaceSeparators('')
      )
      expect(getReadableTokenAmount(new BigNumber('0.0000001'), defaultProps.token)).toBe(
        replaceSeparators('<0.000001 CELO')
      )
      expect(getReadableTokenAmount(new BigNumber('0.0001'), defaultProps.token)).toBe(
        replaceSeparators('0.0001 CELO')
      )
      expect(getReadableTokenAmount(new BigNumber('12.01'), defaultProps.token)).toBe(
        replaceSeparators('12.01 CELO')
      )
      expect(getReadableTokenAmount(new BigNumber('12.00000001'), defaultProps.token)).toBe(
        replaceSeparators('12 CELO')
      )
      expect(getReadableTokenAmount(new BigNumber('123.5678915'), defaultProps.token)).toBe(
        replaceSeparators('123.567892 CELO')
      )
      expect(getReadableTokenAmount(new BigNumber('1234.567891234'), defaultProps.token)).toBe(
        replaceSeparators('1,234.567891 CELO')
      )
      expect(getReadableTokenAmount(new BigNumber('1234567.123456'), defaultProps.token)).toBe(
        replaceSeparators('1,234,567.123456 CELO')
      )
    })

    it('proprly rounds local amount', () => {
      expect(getReadableLocalAmount(null, LocalCurrencySymbol['USD'])).toBe(replaceSeparators(''))
      expect(getReadableLocalAmount(new BigNumber(0), LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('')
      )
      expect(getReadableLocalAmount(new BigNumber('0.0000001'), LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('<$0.000001')
      )
      expect(getReadableLocalAmount(new BigNumber('0.0001'), LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$0.0001')
      )
      expect(getReadableLocalAmount(new BigNumber('0.00789'), LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$0.008')
      )
      expect(getReadableLocalAmount(new BigNumber('12.001'), LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$12.00')
      )
      expect(getReadableLocalAmount(new BigNumber('12.01'), LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$12.01')
      )
      expect(getReadableLocalAmount(new BigNumber('123.5678'), LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$123.57')
      )
      expect(getReadableLocalAmount(new BigNumber('1234.5678'), LocalCurrencySymbol['USD'])).toBe(
        replaceSeparators('$1,234.57')
      )
      expect(
        getReadableLocalAmount(new BigNumber('1234567.5678'), LocalCurrencySymbol['USD'])
      ).toBe(replaceSeparators('$1,234,567.57'))
    })
  })

  describe('useEnterAmount', () => {
    it('initializes with default state', () => {
      jest.mocked(convertTokenToLocalAmount).mockReturnValue(new BigNumber(0))
      const { result } = renderHook(() =>
        useEnterAmount({
          token: { symbol: 'ETH', decimals: 18, tokenId: '1' } as TokenBalance,
        })
      )

      expect(result.current.amount).toBe('')
      expect(result.current.amountType).toBe('token')
    })

    it('properly formats derived state when entering token amount', async () => {
      jest.mocked(useTokenInfo).mockReturnValue(mockCusdTokenBalance)
      jest
        .mocked(convertTokenToLocalAmount)
        .mockReturnValue(
          new BigNumber(1234.123456).multipliedBy(mockCusdTokenBalance.priceUsd!).multipliedBy(1)
        )
      const { result } = renderHook(() =>
        useEnterAmount({
          token: { symbol: 'USDC', decimals: 6, tokenId: mockUSDCTokenId } as TokenBalance,
        })
      )

      await act(() => {
        result.current.handleAmountInputChange('1234.123456')
      })

      expect(result.current.derived).toStrictEqual({
        token: {
          amount: '1234.123456',
          bignum: new BigNumber('1234.123456'),
          readable: '1,234.123456 USDC',
        },
        local: {
          amount: '1235.36',
          bignum: new BigNumber('1235.357579456'),
          readable: '$1,235.36',
        },
      })
    })

    it('properly formats derived state when entering local amount', async () => {
      jest.mocked(useTokenInfo).mockReturnValue(mockCusdTokenBalance)
      jest.mocked(convertTokenToLocalAmount).mockReturnValue(new BigNumber(0))
      jest
        .mocked(convertLocalToTokenAmount)
        .mockReturnValue(
          new BigNumber(1234.123456).dividedBy(1).dividedBy(mockCusdTokenBalance.priceUsd!)
        )
      const { result } = renderHook(() =>
        useEnterAmount({
          token: { symbol: 'USDC', decimals: 6, tokenId: mockUSDCTokenId } as TokenBalance,
        })
      )

      await act(async () => {
        result.current.handleToggleAmountType()
        result.current.handleAmountInputChange('1234.678')
      })

      expect(result.current.derived).toStrictEqual({
        local: {
          amount: '1234.68',
          bignum: new BigNumber('1234.678'),
          readable: '$1,234.68',
        },
        token: {
          amount: '1232.890565',
          bignum: new BigNumber('1232.890565'),
          readable: '1,232.890565 USDC',
        },
      })
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

  describe('component', () => {
    it('displays the correct token information', () => {
      const store = createMockStore(mockStore)
      const { getByText, getByTestId } = render(
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
