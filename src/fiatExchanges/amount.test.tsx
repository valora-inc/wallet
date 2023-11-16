import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import TokenDisplay from 'src/components/TokenDisplay'
import { CryptoAmount, FiatAmount } from 'src/fiatExchanges/amount'
import { CiCoCurrency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import { mockCusdTokenId } from 'test/values'

jest.mock('src/components/TokenDisplay')
jest.mock('src/components/CurrencyDisplay')

describe('CryptoAmount', () => {
  it('passes amount and token address to TokenDisplay', () => {
    render(
      <Provider store={createMockStore()}>
        <CryptoAmount amount={10} currency={CiCoCurrency.cUSD} testID="cryptoAmt" />
      </Provider>
    )
    expect(TokenDisplay).toHaveBeenCalledWith(
      {
        amount: 10,
        showLocalAmount: false,
        testID: 'cryptoAmt',
        tokenId: mockCusdTokenId,
      },
      {}
    )
  })
})

describe('FiatAmount', () => {
  it('passes amount and currency to CurrencyDisplay', () => {
    render(<FiatAmount amount={20} currency="USD" testID="fiatAmt" />)

    expect(CurrencyDisplay).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: {
          value: 0,
          currencyCode: '',
          localAmount: { value: 20, currencyCode: 'USD', exchangeRate: 1 },
        },
        testID: 'fiatAmt',
      }),
      {}
    )
  })
})
