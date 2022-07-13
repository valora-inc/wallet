import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ReviewFetchScreen from 'src/fiatconnect/ReviewFetchScreen'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectQuotes } from 'test/values'

describe('ReviewFetchScreen', () => {
  const mockStore = (overrides: any = {}) => {
    const store = createMockStore({
      fiatConnect: {
        quotes: [mockFiatConnectQuotes[1]],
        quotesLoading: false,
        quotesError: null,
        fiatAccount: {
          providerId: 'provider-two',
          fiatAccountId: '123',
          fiatAccountType: FiatAccountType.BankAccount,
          institutionName: 'Bank of Test',
          accountName: '(...123)',
        },
        fiatAccountLoading: false,
        fiatAccountError: null,
        mostRecentFiatAccountIds: [
          {
            providerId: 'provider-two',
            fiatAccountId: '123',
            fiatAccountType: FiatAccountType.BankAccount,
          },
        ],
        ...overrides,
      },
    })
    store.dispatch = jest.fn()
    return store
  }

  const mockScreenProps = () =>
    getMockStackScreenProps(Screens.FiatConnectReviewFetch, {
      flow: CICOFlow.CashOut,
      selectedCrypto: Currency.Dollar,
      cryptoAmount: 1,
      fiatAmount: 1,
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls dispatch fetchQuoteAndFiatAcount when there is a mostRecentFiatAccount', () => {
    const store = mockStore()
    render(
      <Provider store={store}>
        <ReviewFetchScreen {...mockScreenProps()} />
      </Provider>
    )
    expect(store.dispatch).toHaveBeenCalledWith({
      payload: {
        flow: CICOFlow.CashOut,
        digitalAsset: 'CUSD',
        cryptoAmount: 1,
        providerId: 'provider-two',
        fiatAccountId: '123',
        fiatAccountType: FiatAccountType.BankAccount,
      },
      type: 'fiatConnect/fetchQuoteAndFiatAccount',
    })
  })
  it('navigates to SelectProvider when there is no mostRecentFiatAccount', () => {
    const store = mockStore({ mostRecentFiatAccountIds: [] })
    render(
      <Provider store={store}>
        <ReviewFetchScreen {...mockScreenProps()} />
      </Provider>
    )
    expect(store.dispatch).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
      flow: CICOFlow.CashOut,
      selectedCrypto: Currency.Dollar,
      amount: {
        crypto: 1,
        fiat: 1,
      },
    })
  })
  describe('Something went wrong view', () => {
    it('shows when fiatAccountError or fiatConnectQuotesError are truthy', () => {
      const { queryByTestId } = render(
        <Provider store={mockStore({ fiatAccountError: 'error is here' })}>
          <ReviewFetchScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(queryByTestId('TryAgain')).toBeTruthy()
    })
    it('pressing tryAgain calls dispatch fetchQuoteAndFiatAcount again', () => {
      const store = mockStore({ fiatAccountError: 'error is here' })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <ReviewFetchScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(store.dispatch).toHaveBeenCalledTimes(1)
      expect(queryByTestId('TryAgain')).toBeTruthy()
      fireEvent.press(getByTestId('TryAgain'))
      expect(store.dispatch).toHaveBeenCalledTimes(2)
    })
    it('pressing selectNewProvider navigates to SelectProvider screen', () => {
      const store = mockStore({ fiatAccountError: 'error is here' })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <ReviewFetchScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(queryByTestId('SelectNewProvider')).toBeTruthy()
      fireEvent.press(getByTestId('SelectNewProvider'))
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
        flow: CICOFlow.CashOut,
        selectedCrypto: Currency.Dollar,
        amount: {
          crypto: 1,
          fiat: 1,
        },
      })
    })
    it('pressing contact support navigates to SupportContact screen', () => {
      const store = mockStore({ fiatAccountError: 'error is here' })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <ReviewFetchScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(queryByTestId('SupportContactLink')).toBeTruthy()
      fireEvent.press(getByTestId('SupportContactLink'))
      expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
    })
  })
  it('shows the FiatConnect review view if a quote and fiatAccount were succesfully fetched', () => {
    const { queryByTestId } = render(
      <Provider store={mockStore()}>
        <ReviewFetchScreen {...mockScreenProps()} />
      </Provider>
    )
    expect(queryByTestId('txDetails-total')).toBeTruthy()
    expect(queryByTestId('txDetails-converted')).toBeTruthy()
  })
})
