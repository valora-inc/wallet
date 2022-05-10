import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'
import { createMockStore, getElementText } from 'test/utils'

const localAmount = {
  value: '1.23',
  exchangeRate: '0.555',
  currencyCode: 'EUR',
}

const store = createMockStore({})

it('renders correctly', () => {
  const tree = render(
    <Provider store={store}>
      <ExchangeConfirmationCard
        makerAmount={{ value: '20', currencyCode: 'cGLD', localAmount }}
        takerAmount={{ value: '1.99', currencyCode: 'cUSD', localAmount }}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()

  expect(getElementText(tree.getByTestId('CeloAmount/value'))).toEqual('20.000')
  expect(getElementText(tree.getByTestId('CeloExchangeRate/value'))).toEqual('€0.55')

  expect(getElementText(tree.getByTestId('TotalLineItem/Total/value'))).toEqual('₱2.64') // 1.99 cUSD * 1.33 (PHP)
  expect(getElementText(tree.getByTestId('TotalLineItem/ExchangeRate/value'))).toEqual('$0.75') // 1 / 1.33 (PHP)
  expect(getElementText(tree.getByTestId('TotalLineItem/Subtotal/value'))).toEqual('$1.99')
})

it('renders correctly with giant numbers', () => {
  const tree = render(
    <Provider store={store}>
      <ExchangeConfirmationCard
        makerAmount={{ value: '24000000.00', currencyCode: 'cUSD', localAmount }}
        takerAmount={{ value: '18000000000', currencyCode: 'cGLD', localAmount }}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()

  expect(getElementText(tree.getByTestId('CeloAmount/value'))).toEqual('18,000,000,000.000')
  expect(getElementText(tree.getByTestId('CeloExchangeRate/value'))).toEqual('€0.55')

  expect(getElementText(tree.getByTestId('TotalLineItem/Total/value'))).toEqual('₱31,920,000.00') // 24000000.00 cUSD * 1.33 (PHP)
  expect(getElementText(tree.getByTestId('TotalLineItem/ExchangeRate/value'))).toEqual('$0.75') // 1 / 1.33 (PHP)
  expect(getElementText(tree.getByTestId('TotalLineItem/Subtotal/value'))).toEqual('$24,000,000.00')
})

it('renders correctly when local amount is null', () => {
  const tree = render(
    <Provider store={store}>
      <ExchangeConfirmationCard
        makerAmount={{ value: '20', currencyCode: 'cGLD', localAmount: null }}
        takerAmount={{ value: '1.99', currencyCode: 'cUSD', localAmount: null }}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()

  // This is a degraded mode, when we can't get the exchange rate from the blockchain-api, better than nothing
  expect(getElementText(tree.getByTestId('CeloAmount/value'))).toEqual('20.000')
  expect(getElementText(tree.getByTestId('CeloExchangeRate/value'))).toEqual('-')

  expect(getElementText(tree.getByTestId('TotalLineItem/Total/value'))).toEqual('₱2.64') // 1.99 cUSD * 1.33 (PHP)
  expect(getElementText(tree.getByTestId('TotalLineItem/ExchangeRate/value'))).toEqual('$0.75') // 1 / 1.33 (PHP)
  expect(getElementText(tree.getByTestId('TotalLineItem/Subtotal/value'))).toEqual('$1.99')
})

it('renders correctly when local amount is null and no local exchange rate is set', () => {
  const tree = render(
    <Provider store={createMockStore({ localCurrency: { exchangeRates: {} } })}>
      <ExchangeConfirmationCard
        makerAmount={{ value: '20', currencyCode: 'cGLD', localAmount: null }}
        takerAmount={{ value: '1.99', currencyCode: 'cUSD', localAmount: null }}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()

  // This is an even more degraded mode, when we can't get the exchange rate from the blockchain-api or locally, better than nothing
  expect(getElementText(tree.getByTestId('CeloAmount/value'))).toEqual('20.000')
  expect(getElementText(tree.getByTestId('CeloExchangeRate/value'))).toEqual('-')

  expect(getElementText(tree.getByTestId('TotalLineItem/Total/value'))).toEqual('-')
  expect(tree.queryByTestId('TotalLineItem/ExchangeRate/value')).toBeNull()
  expect(tree.queryByTestId('TotalLineItem/Subtotal/value')).toBeNull()
})
