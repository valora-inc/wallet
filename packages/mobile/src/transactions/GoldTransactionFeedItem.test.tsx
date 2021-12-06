// @ts-ignore
import { toBeDisabled } from '@testing-library/jest-native'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import GoldTransactionFeedItem from 'src/transactions/GoldTransactionFeedItem'
import { TransactionStatus } from 'src/transactions/types'
import { createMockStore, getElementText, getMockI18nProps } from 'test/utils'

expect.extend({ toBeDisabled })

const localAmount = {
  value: '1.23',
  exchangeRate: '0.555',
  currencyCode: 'EUR',
}

describe('GoldTransactionFeedItem', () => {
  let dateNowSpy: any
  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)
    // set the offset to ALWAYS be Pacific for these tests regardless of where they are run
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(() => 420)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore()
  })

  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <GoldTransactionFeedItem
          status={TransactionStatus.Complete}
          __typename="TokenExchange"
          type={TokenTransactionType.Exchange}
          hash={'0x'}
          amount={{ value: '-1', currencyCode: 'cUSD', localAmount }}
          makerAmount={{ value: '1', currencyCode: 'cUSD', localAmount }}
          takerAmount={{ value: '10', currencyCode: 'cGLD', localAmount }}
          timestamp={1}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()

    expect(getElementText(tree.getByTestId('GoldTransactionFeedItemRate/value'))).toEqual('€0.55')
    expect(getElementText(tree.getByTestId('GoldTransactionFeedItemAmount/value'))).toEqual('€1.23')
  })

  it('renders correctly when local amount is null', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <GoldTransactionFeedItem
          status={TransactionStatus.Complete}
          __typename="TokenExchange"
          type={TokenTransactionType.Exchange}
          hash={'0x'}
          amount={{ value: '-1', currencyCode: 'cUSD', localAmount: null }}
          makerAmount={{ value: '1', currencyCode: 'cUSD', localAmount: null }}
          takerAmount={{ value: '10', currencyCode: 'cGLD', localAmount: null }}
          timestamp={1}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()

    // This is a degraded mode, when we can't get the exchange rate from the blockchain-api, better than nothing
    expect(getElementText(tree.getByTestId('GoldTransactionFeedItemRate/value'))).toEqual('-')
    expect(getElementText(tree.getByTestId('GoldTransactionFeedItemAmount/value'))).toEqual(
      '-₱1.33'
    )
  })

  it('renders correctly when local amount is null and no local exchange rate is set', () => {
    const tree = render(
      <Provider store={createMockStore({ localCurrency: { exchangeRates: {} } })}>
        <GoldTransactionFeedItem
          status={TransactionStatus.Complete}
          __typename="TokenExchange"
          type={TokenTransactionType.Exchange}
          hash={'0x'}
          amount={{ value: '-1', currencyCode: 'cUSD', localAmount: null }}
          makerAmount={{ value: '1', currencyCode: 'cUSD', localAmount: null }}
          takerAmount={{ value: '10', currencyCode: 'cGLD', localAmount: null }}
          timestamp={1}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()

    // This is an even more degraded mode, when we can't get the exchange rate from the blockchain-api or locally, better than nothing
    expect(getElementText(tree.getByTestId('GoldTransactionFeedItemRate/value'))).toEqual('-')
    expect(getElementText(tree.getByTestId('GoldTransactionFeedItemAmount/value'))).toEqual('-')
  })

  it('tap disabled while pending', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({})}>
        <GoldTransactionFeedItem
          status={TransactionStatus.Pending}
          __typename="TokenExchange"
          type={TokenTransactionType.Exchange}
          hash={'0x'}
          amount={{ value: '-1', currencyCode: 'cUSD', localAmount }}
          makerAmount={{ value: '1', currencyCode: 'cUSD', localAmount }}
          takerAmount={{ value: '10', currencyCode: 'cGLD', localAmount }}
          timestamp={1}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(getByTestId('GoldTransactionFeedItem')).toBeDisabled()
  })
})
