import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { MoneyAmount } from 'src/apollo/types'
import TotalLineItem from 'src/components/TotalLineItem'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'
import { CurrencyInfo } from 'src/send/SendConfirmationLegacy'
import { Currency } from 'src/utils/currencies'
import { createMockStore, RecursivePartial } from 'test/utils'

const defaultAmount: MoneyAmount = {
  value: '10',
  currencyCode: Currency.Dollar,
}
describe('TotalLineItem', () => {
  function renderComponent({
    storeOverrides = {},
    amount = defaultAmount,
    currencyInfo,
  }: {
    storeOverrides?: RecursivePartial<RootState>
    amount?: MoneyAmount
    currencyInfo?: CurrencyInfo
  }) {
    return render(
      <Provider
        store={createMockStore({
          localCurrency: {
            exchangeRates: { [Currency.Dollar]: null },
          },
          ...storeOverrides,
        })}
      >
        <TotalLineItem amount={amount} currencyInfo={currencyInfo} />
      </Provider>
    )
  }

  describe('when there is an exchange rate to show', () => {
    it('renders correctly', () => {
      const wrapper = renderComponent({
        currencyInfo: {
          localCurrencyCode: LocalCurrencyCode.PHP,
          localExchangeRate: '0.01',
        },
      })
      expect(wrapper).toMatchSnapshot()
    })
  })
  describe("when there isn't an exchange rate to show", () => {
    it("doesn't render the exchange rate", () => {
      const { queryByTestId } = renderComponent({})
      expect(queryByTestId('TotalLineItem/ExchangeRate')).toBeFalsy()
    })
  })
  describe("when there's an exchange rate to show in the currencyInfo", () => {
    it('renders the exchange rate', () => {
      const { queryByTestId } = renderComponent({
        currencyInfo: {
          localCurrencyCode: LocalCurrencyCode.PHP,
          localExchangeRate: '0.01',
        },
      })
      expect(queryByTestId('TotalLineItem/ExchangeRate/value')).toBeTruthy()
    })
  })
  describe("when there's an exchange rate to show in the amount", () => {
    it('renders the exchange rate', () => {
      const { queryByTestId } = renderComponent({
        amount: {
          ...defaultAmount,
          localAmount: {
            value: 10,
            currencyCode: LocalCurrencyCode.PHP,
            exchangeRate: 1.5,
          },
        },
      })
      expect(queryByTestId('TotalLineItem/ExchangeRate/value')).toBeTruthy()
    })
  })

  describe("when there's an exchange rate to show in the redux store", () => {
    it('renders the exchange rate', () => {
      const { queryByTestId } = renderComponent({
        storeOverrides: {
          localCurrency: {
            exchangeRates: { [Currency.Dollar]: '1.5' },
          },
        },
      })
      expect(queryByTestId('TotalLineItem/ExchangeRate/value')).toBeTruthy()
    })
  })
  describe('when the amount is in CELO', () => {
    it('displays the total in CELO and sub total in local currency', () => {
      const { getByText } = renderComponent({
        amount: {
          value: '10.12345',
          currencyCode: Currency.Celo,
          localAmount: {
            value: 15.185175,
            currencyCode: LocalCurrencyCode.EUR,
            exchangeRate: 1.5,
          },
        },
      })
      expect(getByText('10.123').props.testID).toEqual('TotalLineItem/Total/value')
      expect(getByText('€15.18').props.testID).toEqual('TotalLineItem/Subtotal/value')
      // TODO: This should use the local currency
      expect(getByText('$1.50').props.testID).toEqual('TotalLineItem/ExchangeRate/value')
      // expect(getByText('€1.50').props.testID).toEqual('TotalLineItem/ExchangeRate')
    })
  })
  describe('when the amount is in cUSD', () => {
    it('displays the total in local currency and sub total in cUSD', () => {
      const { getByText } = renderComponent({
        amount: {
          value: '10.12345',
          currencyCode: Currency.Dollar,
          localAmount: {
            value: 15.185175,
            currencyCode: LocalCurrencyCode.EUR,
            exchangeRate: 1.5,
          },
        },
      })
      expect(getByText('€15.18').props.testID).toEqual('TotalLineItem/Total/value')
      expect(getByText('$10.12').props.testID).toEqual('TotalLineItem/Subtotal/value')
      // TODO: This should use the local currency
      expect(getByText('$0.66').props.testID).toEqual('TotalLineItem/ExchangeRate/value')
      // expect(getByText('€0.66').props.testID).toEqual('TotalLineItem/ExchangeRate')
    })
  })
  describe('when the amount is in cEUR', () => {
    it('displays the total in local currency and sub total in cEUR', () => {
      const { getByText } = renderComponent({
        amount: {
          value: '10.12345',
          currencyCode: Currency.Euro,
          localAmount: {
            value: 15.185175,
            currencyCode: LocalCurrencyCode.PHP,
            exchangeRate: 1.5,
          },
        },
      })
      expect(getByText('₱15.18').props.testID).toEqual('TotalLineItem/Total/value')
      expect(getByText('€10.12').props.testID).toEqual('TotalLineItem/Subtotal/value')
      // FIXME: why is the rate showing with a $ sign?
      expect(getByText('$0.66').props.testID).toEqual('TotalLineItem/ExchangeRate/value')
    })
  })
})
