import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { mockFiatConnectQuotes } from 'test/values'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { Screens } from 'src/navigator/Screens'
import { Provider } from 'react-redux'
import KycDenied from 'src/fiatconnect/kyc/KycDenied'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import getNavigationOptions from 'src/fiatconnect/kyc/getNavigationOptions'
import { KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { navigate } from 'src/navigator/NavigationService'
import { FiatExchangeEvents } from 'src/analytics/Events'
import { kycTryAgain } from 'src/fiatconnect/slice'
import { Network } from 'src/transactions/types'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/fiatconnect/kyc/getNavigationOptions')

describe('KycDenied', () => {
  const mockStore = (overrides: any = {}) => {
    const store = createMockStore({
      fiatConnect: {
        kycTryAgainLoading: false,
        ...overrides,
      },
    })
    store.dispatch = jest.fn()
    return store
  }

  const mockQuote = new FiatConnectQuote({
    flow: CICOFlow.CashOut,
    fiatAccountType: FiatAccountType.BankAccount,
    quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
  })

  const mockScreenProps = (retryable?: boolean) =>
    getMockStackScreenProps(Screens.KycDenied, {
      flow: CICOFlow.CashOut,
      quote: mockQuote,
      retryable: !!retryable,
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets header options', () => {
    const store = mockStore()
    const mockProps = mockScreenProps()
    render(
      <Provider store={store}>
        <KycDenied {...mockProps} />
      </Provider>
    )
    expect(mockProps.navigation.setOptions).toBeCalledWith(
      getNavigationOptions({
        fiatConnectKycStatus: FiatConnectKycStatus.KycDenied,
        quote: mockQuote,
      })
    )
  })
  it('shows a spinner if loading', () => {
    const store = mockStore({ kycTryAgainLoading: true })
    const mockProps = mockScreenProps()
    const { queryByTestId } = render(
      <Provider store={store}>
        <KycDenied {...mockProps} />
      </Provider>
    )
    expect(queryByTestId('spinnerContainer')).toBeTruthy()
  })
  it('does not show try again if not retryable', () => {
    const store = mockStore()
    const mockProps = mockScreenProps()
    const { queryByTestId } = render(
      <Provider store={store}>
        <KycDenied {...mockProps} />
      </Provider>
    )
    expect(queryByTestId('tryAgainButton')).toBeFalsy()
  })
  it('pressing switch button navigates to select provider', () => {
    const store = mockStore()
    const mockProps = mockScreenProps()
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <KycDenied {...mockProps} />
      </Provider>
    )
    expect(queryByTestId('switchButton')).toBeTruthy()
    fireEvent.press(getByTestId('switchButton'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_fc_kyc_status_switch_method,
      {
        provider: mockQuote.getProviderId(),
        flow: CICOFlow.CashOut,
        fiatConnectKycStatus: FiatConnectKycStatus.KycDenied,
      }
    )
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
      flow: CICOFlow.CashOut,
      selectedCrypto: mockQuote.getCryptoType(),
      amount: {
        crypto: Number(mockQuote.getCryptoAmount()),
        fiat: Number(mockQuote.getFiatAmount()),
      },
      network: Network.Celo,
    })
  })
  it('pressing try again button dispatches action', () => {
    const store = mockStore()
    const mockProps = mockScreenProps(true)
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <KycDenied {...mockProps} />
      </Provider>
    )
    expect(queryByTestId('tryAgainButton')).toBeTruthy()
    fireEvent.press(getByTestId('tryAgainButton'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_fc_kyc_status_try_again,
      {
        provider: mockQuote.getProviderId(),
        flow: CICOFlow.CashOut,
        fiatConnectKycStatus: FiatConnectKycStatus.KycDenied,
      }
    )
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      kycTryAgain({ quote: mockQuote, flow: CICOFlow.CashOut })
    )
  })
})
