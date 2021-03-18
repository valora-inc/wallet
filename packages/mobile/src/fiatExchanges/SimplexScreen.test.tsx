// import { CURRENCY_ENUM } from '@celo/utils'
// import { FetchMock } from 'jest-fetch-mock/types'
// import * as React from 'react'
// import { render, waitForElement } from 'react-native-testing-library'
// import { Provider } from 'react-redux'
// import SimplexScreen from 'src/fiatExchanges/SimplexScreen'
// import { LocalCurrencyCode } from 'src/localCurrency/consts'
// import { Screens } from 'src/navigator/Screens'
// import { createMockStore, getMockStackScreenProps } from 'test/utils'
// import { mockAccount, mockE164Number } from 'test/values'
// import { v4 as uuidv4 } from 'uuid'

// const AMOUNT_TO_CASH_IN = 100

// const mockUserIpAddress = '1.1.1.1.1.1.0'

// const MOCK_USER_ACCOUNT_CREATION_DATA_RESPONSE = JSON.stringify({
//   timestamp: new Date().toISOString(),
//   userAgent: 'fake user agent',
//   ipAddress: mockUserIpAddress,
// })

// const MOCK_SIMPLEX_PAYMENT_REQUEST_RESPONSE = JSON.stringify({
//   is_kyc_update_required: false,
// })

// const mockStore = createMockStore({
//   web3: {
//     account: mockAccount,
//   },
//   account: {
//     e164PhoneNumber: mockE164Number,
//     defaultCountryCode: '+1',
//   },
//   app: {
//     numberVerified: true,
//   },
//   localCurrency: {
//     preferredCurrencyCode: LocalCurrencyCode.USD,
//   },
// })

// const MOCK_SIMPLEX_QUOTE = {
//   user_id: mockAccount,
//   quote_id: uuidv4(),
//   wallet_id: 'valorapp',
//   digital_money: {
//     currency: 'CUSD',
//     amount: 25,
//   },
//   fiat_money: {
//     currency: 'USD',
//     base_amount: 19,
//     total_amount: 6,
//   },
//   valid_until: new Date().toISOString(),
//   supported_digital_currencies: ['CUSD', 'CELO'],
// }

// const mockScreenProps = (isCashIn: boolean) =>
//   getMockStackScreenProps(Screens.Simplex, {
//     simplexQuote: MOCK_SIMPLEX_QUOTE,
//     userIpAddress: CURRENCY_ENUM.DOLLAR,
//     amount: AMOUNT_TO_CASH_IN,
//   })

// describe('SimplexScreen', () => {
//   const mockFetch = fetch as FetchMock
//   beforeEach(() => {
//     jest.useRealTimers()
//     jest.clearAllMocks()
//     mockFetch.resetMocks()
//   })

//   it('renders correctly', async () => {
//     mockFetch.mockResponses(
//       MOCK_USER_ACCOUNT_CREATION_DATA_RESPONSE,
//       MOCK_SIMPLEX_PAYMENT_REQUEST_RESPONSE
//     )

//     const tree = render(
//       <Provider store={mockStore}>
//         <SimplexScreen {...mockScreenProps(true)} />
//       </Provider>
//     )

//     expect(tree).toMatchSnapshot()
//     await waitForElement(() => tree.getByText('pleaseSelectProvider'))
//     expect(tree).toMatchSnapshot()
//   })
// })
