import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import ExchangeReview from 'src/exchange/ExchangeReview'
import { ExchangeRates } from 'src/exchange/reducer'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { makeExchangeRates } from 'test/values'

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '9.09090909')

// This mocks the default and named exports for DisconnectBanner
// Which is necessary because one of the tests below doesn't work when
// we render the component using the mockStore, meaning we need to mock
// children that connect to the store
jest.mock('src/shared/DisconnectBanner', () => ({
  __esModule: true,
  default: () => null,
  DisconnectBanner: () => null,
}))

const store = createMockStore({
  exchange: {
    exchangeRates,
  },
})

const mockScreenProps = getMockStackScreenProps(Screens.ExchangeReview, {
  makerToken: Currency.Celo,
  takerToken: Currency.Dollar,
  inputToken: Currency.Celo,
  inputTokenDisplayName: 'gold',
  inputAmount: new BigNumber(10),
  celoAmount: new BigNumber(10),
  stableAmount: new BigNumber(10 / 0.11),
})

describe('ExchangeReview', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <ExchangeReview {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
